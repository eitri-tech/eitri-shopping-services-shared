import Eitri from 'eitri-bifrost'
import { Vtex } from 'eitri-shopping-vtex-shared'

import WeniWebchatService from './weni/index'
import { SERVICE_EVENTS } from './weni/utils/constants'
import {
	hydrate,
	persist,
	clearMirror,
	isUsingMemoryStore,
	getStoredSessionId,
	clearLocalSession
} from './weni/env/EitriEnv'
import { diagLog, getDiag } from './weni/env/diag'
import { getChatConfig } from '../config/ChatConfig'

/**
 * ChatService
 *
 * Fachada/singleton Eitri sobre a lib Weni vendorizada (./weni). Versão da
 * shared lib: toda a parametrização (socketUrl, channelUuid, host, initPayload,
 * conta fallback, debug) vem da config resolvida pelo ChatConfig
 * (defaults <- remoteConfig <- overrides), não de constantes.
 *
 * Responsabilidades:
 *  - manter UMA instância do serviço entre navegações (socket/sessão vivos)
 *  - alimentar os custom fields Weni (vtex_account, email, session JWT) a
 *    partir da sessão VTEX do app host
 *  - espelhar o storage da lib em Eitri.sharedStorage (durabilidade)
 *  - isolar a conversa por usuário (sessionId = email:account)
 */

function dbg(...args) {
	if (getChatConfig().debug) diagLog(...args)
}

// Re-exportado para a UI renderizar o painel de diagnóstico on-screen.
export { getDiag }

let _service = null
let _initPromise = null
let _persistTimer = null
// Identidade ("email:account:surface") para a qual o _service atual foi
// construído. Detecta troca de usuário (logout + login) e reseta o chat para
// o histórico nunca vazar entre usuários.
let _builtIdentity = undefined
// Superfície ('home', 'account', ...) desta instância — setada em initChat().
let _surface = null

/** Espelho debounced do storage da lib no Eitri.sharedStorage. */
function schedulePersist() {
	if (_persistTimer) clearTimeout(_persistTimer)
	_persistTimer = setTimeout(() => {
		_persistTimer = null
		persist(_surface)
	}, 600)
}

/**
 * Resolve a conta VTEX para o custom field `vtex_account`.
 * Vtex.configs.account é populado por App.tryAutoConfigure() no start do app.
 * @returns {string}
 */
function resolveVtexAccount() {
	try {
		const account = Vtex?.configs?.account
		if (account && typeof account === 'string') return account
	} catch (error) {
		console.log('[ChatService] resolveVtexAccount error', error)
	}
	return getChatConfig().defaultVtexAccount
}

/**
 * Resolve o e-mail do usuário logado para o custom field `email`.
 * @returns {Promise<string|null>}
 */
async function resolveEmail() {
	try {
		const profile = await Vtex.customer.getCustomerProfile()
		return profile?.data?.profile?.email || null
	} catch (error) {
		console.log('[ChatService] resolveEmail error', error)
	}
	return null
}

/**
 * Resolve o JWT de sessão VTEX (token data-signer) para o custom field `session`.
 * Degrada graciosamente (null) — o chat funciona só com vtex_account + email.
 * @returns {Promise<string|null>}
 */
async function resolveSessionToken() {
	try {
		const result = await Vtex.session.getSessionToken()
		const token = result?.sessionToken
		if (token && typeof token === 'string') return token
	} catch (error) {
		console.log('[ChatService] resolveSessionToken (getSessionToken) error', error)
	}
	try {
		const cached = Vtex?.configs?.session
		if (cached && typeof cached === 'string') return cached
	} catch (error) {
		console.log('[ChatService] resolveSessionToken (configs) error', error)
	}
	return null
}

/**
 * Resolve o orderFormId (carrinho) do APP para o custom field `orderform`.
 * É por esse campo que o flow/bot adiciona produtos ao carrinho do lado do
 * servidor quando o usuário PEDE por mensagem ("adiciona todos no carrinho") —
 * o widget web oficial publica exatamente essa key (CounterControls:
 * setOrderFormCustomFieldThrottled('orderform', id)). Sem ele, o bot não sabe
 * em qual carrinho operar.
 *
 * Usa o orderForm já armazenado pelo app; se não existir, cria via
 * getCurrentOrCreateCart() — o mesmo caminho dos providers de carrinho dos
 * apps host, então o id é compartilhado.
 * @returns {Promise<string|null>}
 */
async function resolveOrderFormId() {
	try {
		const stored = await Vtex.cart.getStoredOrderFormId()
		if (stored && typeof stored === 'string') return stored
	} catch (error) {
		dbg('resolveOrderFormId (stored) error', error && (error.message || JSON.stringify(error)))
	}
	try {
		const cart = await Vtex.cart.getCurrentOrCreateCart()
		return cart?.orderFormId || cart?.id || null
	} catch (error) {
		dbg('resolveOrderFormId (create) error', error && (error.message || JSON.stringify(error)))
	}
	return null
}

/**
 * Identidade por usuário usada como session id Weni (campo `from`), espelhando
 * o widget web de produção (`${email}:${org}`) e escopada por superfície.
 * Deslogado cai em `anon:${org}:${surface}` — nunca null, pra duas superfícies
 * sem usuário logado (ex.: Home antes do login) também não colidirem.
 * @param {string} surface
 * @returns {Promise<string>}
 */
async function resolveSessionIdentity(surface) {
	const [email, account] = await Promise.all([resolveEmail(), Promise.resolve(resolveVtexAccount())])
	return `${email || 'anon'}:${account}:${surface}`
}

// Últimos valores enviados, para emitir set_custom_field só quando algo muda
// (ex.: rotação do token de sessão). Resetado quando a sessão é recriada.
let _lastFields = {}

function setFieldIfChanged(service, key, value) {
	if (value && _lastFields[key] !== value) {
		service.setCustomField(key, value)
		_lastFields[key] = value
	}
}

/**
 * Aplica os custom fields Weni, emitindo somente os que mudaram.
 * @param {WeniWebchatService} service
 */
async function applyCustomFields(service) {
	const withCart = getChatConfig().addToCart !== false
	const [account, email, sessionToken, orderFormId] = await Promise.all([
		resolveVtexAccount(),
		resolveEmail(),
		resolveSessionToken(),
		withCart ? resolveOrderFormId() : Promise.resolve(null)
	])

	setFieldIfChanged(service, 'vtex_account', account)
	setFieldIfChanged(service, 'email', email)
	setFieldIfChanged(service, 'session', sessionToken)
	setFieldIfChanged(service, 'orderform', orderFormId)
}

/**
 * Re-publica o custom field `orderform` se o id do carrinho mudou. Chamar após
 * adicionar ao carrinho pelo app (a primeira adição pode CRIAR o orderForm) —
 * mantém o bot apontando para o mesmo carrinho que o usuário vê.
 * @returns {Promise<void>}
 */
export async function syncOrderFormField() {
	if (!_service) return
	try {
		const orderFormId = await resolveOrderFormId()
		setFieldIfChanged(_service, 'orderform', orderFormId)
	} catch (error) {
		dbg('syncOrderFormField error', error && (error.message || JSON.stringify(error)))
	}
}

/**
 * Envia o initPayload configurado como mensagem oculta para disparar o flow do
 * bot em uma sessão nova. No-op quando vazio.
 * @param {WeniWebchatService} service
 */
function sendInitTrigger(service) {
	const payload = getChatConfig().initPayload
	if (payload && typeof payload === 'string') {
		dbg('sendInitTrigger', payload)
		service.sendMessage(payload, { hidden: true })
	}
}

/**
 * Revalida os custom fields derivados da VTEX (especialmente o token de sessão)
 * e envia os que mudaram. Chamar ao entrar no chat.
 * @returns {Promise<void>}
 */
export async function syncCustomFields() {
	if (!_service) return
	try {
		await applyCustomFields(_service)
	} catch (error) {
		dbg('syncCustomFields error', error && (error.message || JSON.stringify(error)))
	}
}

/**
 * Retorna a instância singleton (criando-a se preciso) com a config efetiva.
 * @param {string|null} [sessionId] id por usuário para escopar a conversa
 * @returns {WeniWebchatService}
 */
export function getChatService(sessionId) {
	if (_service) return _service

	const config = getChatConfig()
	_service = new WeniWebchatService({
		socketUrl: config.socketUrl,
		channelUuid: config.channelUuid,
		host: config.host,
		clientId: config.defaultVtexAccount,
		sessionId: sessionId || undefined,
		// Sempre 'mount': numa tela de chat mobile o socket deve abrir junto com
		// o init (o 'demand' do widget web espera o clique no launcher).
		connectOn: 'mount',
		storage: config?.params?.storage || 'local'
	})

	_service.on(SERVICE_EVENTS.STATE_CHANGED, schedulePersist)
	_service.on(SERVICE_EVENTS.MESSAGE_SENT, schedulePersist)
	_service.on(SERVICE_EVENTS.MESSAGE_RECEIVED, schedulePersist)
	_service.on(SERVICE_EVENTS.SESSION_CLEARED, () => clearMirror(_surface))

	return _service
}

/**
 * Derruba o serviço em memória e limpa a sessão/espelho locais. Chamar no
 * logout do app host (e internamente na troca de usuário).
 * @returns {Promise<void>}
 */
export async function resetChat() {
	try {
		_service?.destroy?.()
	} catch (error) {
		dbg('resetChat destroy error', error && (error.message || JSON.stringify(error)))
	}
	_service = null
	_initPromise = null
	_builtIdentity = undefined
	_lastFields = {}
	if (_persistTimer) {
		clearTimeout(_persistTimer)
		_persistTimer = null
	}
	await clearLocalSession(_surface)
}

/**
 * Inicializa o chat: hidrata a sessão persistida, constrói o serviço, aplica
 * custom fields e conecta. Idempotente. A config já deve ter sido resolvida
 * (loadChatConfig) — o hook/Componente cuidam disso.
 * @param {string} surface superfície do chat ('home', 'account', ...), escopa
 *   a identidade Weni e o storage para não colidir com outras superfícies
 * @returns {Promise<WeniWebchatService>}
 */
export function initChat(surface) {
	_surface = surface
	// Resolve a identidade em TODA chamada (antes de reusar o init cacheado)
	// para detectar troca de usuário.
	return (async () => {
		const identity = await resolveSessionIdentity(surface)

		if (_builtIdentity !== undefined && _builtIdentity !== identity) {
			dbg('initChat: identity changed (' + _builtIdentity + ' -> ' + identity + '), resetting chat')
			await resetChat()
		}

		if (_initPromise) return _initPromise

		_builtIdentity = identity
		_initPromise = buildChat(identity, surface)
		return _initPromise
	})()
}

/**
 * Constrói e conecta o serviço para uma identidade de usuário.
 * @param {string|null} identity
 * @param {string} surface
 * @returns {Promise<WeniWebchatService>}
 */
function buildChat(identity, surface) {
	return (async () => {
		try {
			const config = getChatConfig()
			dbg('initChat: start (identity=' + identity + ')')
			await hydrate(surface)
			dbg('initChat: hydrate done')

			// Sessão persistida de outra identidade: limpa para nunca restaurar a
			// conversa de outro usuário. "Nova conversa" usa `identity-<epoch>`,
			// então esse sufixo conta como o mesmo usuário.
			const storedId = getStoredSessionId()
			const sameUser = storedId === identity || (identity && storedId && storedId.startsWith(identity + '-'))
			// Builds antigos usavam `identity#<epoch>`. O '#' é escapado para %23 no
			// URN do contato lá no servidor, então essas sessões apontam para um
			// contato órfão. Limpa (mesmo deslogado) para voltar ao contato real.
			const isLegacyHashId = typeof storedId === 'string' && storedId.includes('#')
			if (storedId && (isLegacyHashId || (identity && !sameUser))) {
				dbg('initChat: stored session (' + storedId + ') != identity, clearing local cache')
				await clearLocalSession(surface)
			}
			// Sessão nova (sem conversa restaurável) precisa do trigger do flow.
			const isNewSession = !(storedId && sameUser)

			const service = getChatService(identity)
			dbg('initChat: service created', {
				socketUrl: config.socketUrl,
				channelUuid: config.channelUuid,
				host: config.host,
				identity,
				memoryStore: isUsingMemoryStore()
			})

			service.on(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, status => dbg('event connection:status:changed ->', status))
			service.on(SERVICE_EVENTS.CONNECTED, () => dbg('event connected'))
			service.on(SERVICE_EVENTS.DISCONNECTED, () => dbg('event disconnected'))
			service.on(SERVICE_EVENTS.RECONNECTING, a => dbg('event reconnecting', a))
			service.on(SERVICE_EVENTS.WS_REGISTERED, () => dbg('event registered'))
			service.on(SERVICE_EVENTS.ERROR, err => dbg('event ERROR', err && (err.message || err.reason || JSON.stringify(err))))

			// A sessão precisa existir ANTES dos custom fields: setCustomField guarda
			// valores pendentes NA sessão (anexados à primeira mensagem do usuário).
			await service.restoreOrCreateSession()
			dbg('initChat: session ready', service.getSessionId())
			await applyCustomFields(service)
			dbg('initChat: custom fields applied')

			// init() só resolve quando o servidor confirma (ready_for_message); não
			// bloqueamos a UI nisso — corremos contra um timeout curto e deixamos o
			// estado de conexão fluir por eventos.
			const READY_TIMEOUT_MS = 1500
			service.init().catch(err => dbg('service.init() rejected', err && (err.message || JSON.stringify(err))))
			await Promise.race([
				new Promise(resolve => {
					service.once(SERVICE_EVENTS.CONNECTED, resolve)
					service.once(SERVICE_EVENTS.INITIALIZED, resolve)
				}),
				new Promise(resolve => setTimeout(resolve, READY_TIMEOUT_MS))
			])
			dbg('initChat: ready (status=' + service.getConnectionStatus() + ')')
			if (isNewSession) sendInitTrigger(service)
			return service
		} catch (err) {
			dbg('initChat: THREW', err && (err.message || JSON.stringify(err)))
			throw err
		}
	})()
}

/**
 * Reconecta o socket se ele não estiver conectado/conectando. Chamar no mount
 * da tela do chat para uma sessão que caiu (ou foi suspensa/expulsa) voltar ao
 * entrar de novo.
 * @returns {Promise<void>}
 */
export async function ensureConnected() {
	const service = _service
	if (!service) return
	const status = service.getConnectionStatus()
	if (['connected', 'connecting', 'reconnecting', 'disconnecting'].includes(status)) return
	try {
		dbg('ensureConnected: reconnecting (status=' + status + ')')
		// Um disconnect permanente anterior (suspendChat, kick do servidor via
		// "Connection closed by request", nova conversa) desliga o autoReconnect;
		// religa para esta nova vida da conexão.
		if (service.websocket?.config) service.websocket.config.autoReconnect = true
		service.resetRetryStrategy && service.resetRetryStrategy()
		await service.connect()
	} catch (error) {
		dbg('ensureConnected error', error && (error.message || JSON.stringify(error)))
	}
}

/**
 * Suspende a conexão SEM apagar a sessão/histórico: disconnect permanente (não
 * agenda reconexão). A próxima entrada na tela do chat religa via
 * ensureConnected(). Use ao sair da experiência de chat — especialmente quando
 * OUTRO cliente webchat com o mesmo `from` pode conectar (o servidor Weni
 * permite UMA conexão por `from`; dois clientes vivos se expulsam mutuamente
 * via close_session, gerando loop infinito de "reconectando").
 */
export function suspendChat() {
	if (!_service) return
	try {
		dbg('suspendChat: disconnecting (status=' + _service.getConnectionStatus() + ')')
		_service.disconnect(true)
	} catch (error) {
		dbg('suspendChat error', error && (error.message || JSON.stringify(error)))
	}
}

/**
 * Aguarda o socket atual fechar de fato (evento close) após um disconnect.
 * Sem isso, o close do socket VELHO pode chegar depois do connect() novo e
 * clobberar o status da conexão nova (corrida do "Nova conversa").
 * @param {WeniWebchatService} service
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
function waitForSocketClosed(service, timeoutMs = 1500) {
	return new Promise(resolve => {
		const socket = service?.websocket?.socket
		// 3 === WebSocket.CLOSED
		if (!socket || socket.readyState === 3) return resolve()
		let timer = null
		const done = () => {
			if (timer) clearTimeout(timer)
			try {
				socket.removeEventListener('close', done)
			} catch (_) {
				/* noop */
			}
			resolve()
		}
		timer = setTimeout(done, timeoutMs)
		socket.addEventListener('close', done)
	})
}

/**
 * Inicia uma conversa totalmente nova (id = identidade + epoch): o servidor
 * trata como novo contato/sessão, o histórico local é limpo e o flow recomeça.
 * @returns {Promise<void>}
 */
export async function startNewConversation() {
	const service = getChatService()
	const identity = await resolveSessionIdentity(_surface)
	// Separador '-' e não '#': o '#' vira %23 no URN do contato lá no servidor.
	const newId = `${identity}-${Date.now()}`
	try {
		// NÃO usar service.setSessionId(): ele faz disconnect(false) (agenda
		// auto-reconnect) + connect() => duas conexões competindo. Em vez disso:
		// disconnect permanente, troca local da sessão, e UM connect explícito.
		service.disconnect(true)
		// Espera o close do socket velho chegar ANTES de religar — senão o evento
		// atrasado derruba o status da conexão nova.
		await waitForSocketClosed(service)
		service.clearSession()
		service.session.setSessionId(newId)
		service.createNewSession()

		// Sessão nova: reenvia TODOS os custom fields.
		_lastFields = {}
		await applyCustomFields(service)

		if (service.websocket?.config) service.websocket.config.autoReconnect = true
		if (service.websocket) service.websocket._reclaimAttempts = 0
		service.resetRetryStrategy && service.resetRetryStrategy()
		await service.connect()
		sendInitTrigger(service)
	} catch (error) {
		dbg('startNewConversation error', error && (error.message || JSON.stringify(error)))
	}
}

/**
 * Envia uma mensagem de texto pelo serviço ativo.
 * @param {string} text
 */
export async function sendChatMessage(text) {
	const service = getChatService()
	return service.sendMessage(text)
}

// --- Anexos (pickers nativos Eitri) ------------------------------------------

/**
 * @param {string} mimeType
 * @returns {'image'|'video'|'audio'|'file'}
 */
function mediaTypeFromMime(mimeType) {
	const m = (mimeType || '').toLowerCase()
	if (m.startsWith('image/')) return 'image'
	if (m.startsWith('video/')) return 'video'
	if (m.startsWith('audio/')) return 'audio'
	return 'file'
}

/**
 * Codifica um EitriFile como data URL e envia como mídia.
 */
async function sendEitriFile(service, eitriFile) {
	const base64 = await eitriFile.toBase64()
	const mimeType = eitriFile.mimeType || 'application/octet-stream'
	const dataUrl = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`
	await service.sendMedia(mediaTypeFromMime(mimeType), dataUrl, {
		filename: eitriFile.fileName,
		size: eitriFile.size,
		mimeType
	})
}

/**
 * Tira uma foto com a câmera e envia.
 * @returns {Promise<boolean>}
 */
export async function sendCameraPhoto() {
	try {
		const perm = await Eitri.camera.checkPermission()
		if (perm?.status !== 'GRANTED') {
			const req = await Eitri.camera.requestPermission()
			if (req?.status !== 'GRANTED') return false
		}
		const file = await Eitri.camera.takePicture({ quality: 0.6, width: 1280, keepAspectRatio: true })
		if (!file) return false
		await sendEitriFile(getChatService(), file)
		return true
	} catch (error) {
		dbg('sendCameraPhoto error', error && (error.message || JSON.stringify(error)))
		return false
	}
}

/**
 * Abre a galeria e envia a imagem selecionada.
 * @returns {Promise<boolean>}
 */
export async function sendGalleryImage() {
	try {
		const files = await Eitri.fs.openImagePicker({ maxSize: 8 * 1024 * 1024, allowsMultipleSelection: false })
		if (!Array.isArray(files) || files.length === 0) return false
		await sendEitriFile(getChatService(), files[0])
		return true
	} catch (error) {
		dbg('sendGalleryImage error', error && (error.message || JSON.stringify(error)))
		return false
	}
}

/**
 * Abre o seletor de documentos e envia o arquivo.
 * @returns {Promise<boolean>}
 */
export async function sendDocument() {
	try {
		const files = await Eitri.fs.openFilePicker({
			fileExtension: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
			maxSize: 8 * 1024 * 1024,
			allowsMultipleSelection: false
		})
		if (!Array.isArray(files) || files.length === 0) return false
		await sendEitriFile(getChatService(), files[0])
		return true
	} catch (error) {
		dbg('sendDocument error', error && (error.message || JSON.stringify(error)))
		return false
	}
}

// --- Voz (ditado via Eitri speech-to-text) ------------------------------------

/**
 * Módulo nativo de speech instalado/disponível?
 * @returns {Promise<boolean>}
 */
export async function isVoiceAvailable() {
	try {
		const modules = await Eitri.modules()
		return !!modules?.speech?.startSpeechRecognition
	} catch (_) {
		return false
	}
}

let _dictationChannel = null

function clearDictationChannel() {
	if (_dictationChannel) {
		try {
			Eitri.eventBus.clear({ channel: _dictationChannel })
		} catch (_) {
			/* noop */
		}
		_dictationChannel = null
	}
}

async function ensureSpeechPermission() {
	const perm = await Eitri.speech.checkPermission()
	if (perm?.status === 'GRANTED') return true
	const req = await Eitri.speech.requestPermission()
	return req?.status === 'GRANTED'
}

/**
 * Inicia o ditado por voz (speech-to-text). Prefere a API de STREAMING
 * (parciais via EventBus); cai para a one-shot quando indisponível.
 * @param {{ onPartial?: (text:string)=>void, onFinal?: (text:string|null)=>void }} cb
 * @returns {Promise<'stream'|'oneshot'|null>}
 */
export async function startDictation(cb = {}) {
	const { onPartial, onFinal } = cb
	try {
		const modules = await Eitri.modules()
		if (!modules?.speech?.startSpeechRecognition) {
			onFinal && onFinal(null)
			return null
		}
		if (!(await ensureSpeechPermission())) {
			onFinal && onFinal(null)
			return null
		}

		if (modules.speech.startSpeechRecognitionStream) {
			const res = await Eitri.speech.startSpeechRecognitionStream({ language: 'pt-BR' })
			_dictationChannel = res?.dataChannel || null
			if (!_dictationChannel) {
				onFinal && onFinal(null)
				return null
			}
			Eitri.eventBus.subscribe({
				channel: _dictationChannel,
				callback: result => {
					const text = result?.data?.text || ''
					if (result?.final) {
						clearDictationChannel()
						onFinal && onFinal(text || null)
					} else {
						onPartial && onPartial(text)
					}
				}
			})
			return 'stream'
		}

		const result = await Eitri.speech.startSpeechRecognition({ language: 'pt-BR' })
		onFinal && onFinal(result?.text || null)
		return 'oneshot'
	} catch (error) {
		dbg('startDictation error', error && (error.message || JSON.stringify(error)))
		clearDictationChannel()
		onFinal && onFinal(null)
		return null
	}
}

/**
 * Para o reconhecimento nativo e cancela a inscrição nos parciais. O caller
 * (hook) finaliza/envia o texto acumulado — não dependemos do chunk `final`.
 * @returns {Promise<void>}
 */
export async function stopDictation() {
	clearDictationChannel()
	try {
		await Eitri.speech.stopSpeechRecognition()
	} catch (error) {
		dbg('stopDictation error', error && (error.message || JSON.stringify(error)))
	}
}

/**
 * Carrega uma página mais antiga do histórico (paginação).
 * @param {number} page
 * @returns {Promise<Array>}
 */
export async function loadHistoryPage(page) {
	const service = getChatService()
	return service.getHistory({ page, limit: 20 })
}

export { SERVICE_EVENTS }
