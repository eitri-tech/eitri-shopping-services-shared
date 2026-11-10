import Eitri from 'eitri-bifrost'
import { NexusError } from '../../errors/NexusError'
import type { NexusSession as Session } from '../../models/Nexus'
import { getApplicationId, getConfig } from '../_helpers/config'
import { httpStatusOf, isObject } from '../_helpers/http'

const STORAGE_KEY = 'nexus.session'

type StorageOptions = { shared: true } | undefined

let sharedMode: boolean | null = null

/**
 * Storage compartilhado para todos os eitri-apps usarem o mesmo customer. Sem AppGroup no container,
 * a flag `shared` lança e cai no storage do próprio app.
 */
const withSharedFallback = async <T>(run: (opts: StorageOptions) => Promise<T>): Promise<T> => {
	if (sharedMode === false) return run(undefined)
	try {
		const result = await run({ shared: true })
		sharedMode = true
		return result
	} catch (e) {
		sharedMode = false
		return run(undefined)
	}
}

const normalizeSession = (raw: unknown): Session | null => {
	if (!isObject(raw)) return null
	const { installationId, token, applicationId, registeredAt } = raw
	if (typeof token !== 'string' || !token) return null
	if (typeof applicationId !== 'string' || !applicationId) return null
	return {
		installationId: typeof installationId === 'string' ? installationId : '',
		token,
		applicationId,
		registeredAt: typeof registeredAt === 'string' ? registeredAt : ''
	}
}

/**
 * Cada `POST /register` cria instalação e customer vazios, e o token só vem nessa resposta:
 * registrar sem necessidade deixa os dados do usuário inacessíveis.
 */
export default class NexusSession {
	private static cached: Session | null = null
	private static pending: Promise<Session> | null = null

	static getAppId(): string {
		const appId = getApplicationId()
		if (!appId) throw new NexusError('NO_APP_ID', 'applicationId indisponível: chame Dnvb.configure ou rode dentro do Eitri')
		return appId
	}

	/** Relê o cache depois do `await`: um register concorrente pode ter terminado enquanto o storage era lido. */
	static async get(): Promise<Session | null> {
		const appId = NexusSession.getAppId()
		if (NexusSession.cached?.applicationId === appId) return NexusSession.cached
		let stored: Session | null = null
		try {
			stored = normalizeSession(await withSharedFallback(opts => Eitri.storage.getItemJson(STORAGE_KEY, opts)))
		} catch (e) {
			console.warn('[nexus] falha ao ler sessão do storage', e)
		}
		if (stored?.applicationId === appId) NexusSession.cached = stored
		return NexusSession.cached?.applicationId === appId ? NexusSession.cached : null
	}

	static async ensure(): Promise<Session> {
		const current = await NexusSession.get()
		if (current) return current
		if (!NexusSession.pending) {
			NexusSession.pending = NexusSession.register().finally(() => {
				NexusSession.pending = null
			})
		}
		return NexusSession.pending
	}

	/** Apaga só a sessão do device: o customer continua no Nexus e volta pelo `link` no próximo login. */
	static async clear(): Promise<void> {
		NexusSession.cached = null
		try {
			await withSharedFallback(opts => Eitri.storage.removeItem(STORAGE_KEY, opts))
		} catch (e) {
			console.warn('[nexus] falha ao limpar sessão do storage', e)
		}
	}

	/** Só limpa se a sessão salva ainda for a recusada: com requests concorrentes, o segundo 401 não pode descartar o register do primeiro. */
	static async invalidate(rejectedToken: string): Promise<void> {
		const current = await NexusSession.get()
		if (current?.token === rejectedToken) await NexusSession.clear()
	}

	private static async register(): Promise<Session> {
		const applicationId = NexusSession.getAppId()
		let response: any
		try {
			response = await Eitri.http.post(
				`${getConfig().nexusUrl}/register`,
				{ applicationId },
				{ headers: { 'Content-Type': 'application/json' } }
			)
		} catch (e) {
			console.warn('[nexus] falha no register', e)
			throw new NexusError('NETWORK_ERROR', 'Não foi possível registrar a instalação', httpStatusOf(e))
		}
		const session = normalizeSession({
			...(isObject(response?.data) ? response.data : {}),
			applicationId,
			registeredAt: new Date().toISOString()
		})
		if (!session) throw new NexusError('INVALID_PAYLOAD', 'register sem token na resposta')
		try {
			await withSharedFallback(opts => Eitri.storage.setItemJson(STORAGE_KEY, session, opts))
		} catch (e) {
			console.warn('[nexus] sessão registrada mas não persistida', e)
		}
		NexusSession.cached = session
		return session
	}
}
