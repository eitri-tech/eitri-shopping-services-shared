import { useState, useEffect, useRef, useCallback } from 'react'

import { loadChatConfig, getChatConfig } from '../config/ChatConfig'
import {
	initChat,
	ensureConnected,
	syncCustomFields,
	startNewConversation,
	SERVICE_EVENTS,
	getDiag,
	sendCameraPhoto,
	sendGalleryImage,
	sendDocument,
	startDictation,
	stopDictation,
	isVoiceAvailable,
	loadHistoryPage
} from '../services/ChatService'

/**
 * useWeniChat
 *
 * Ponte React sobre o serviço Weni da shared lib. Resolve a config efetiva
 * (defaults <- remoteConfig <- overrides), inicializa o serviço e expõe estado
 * plano + callbacks de ação para a UI.
 *
 * O serviço por baixo é um singleton: desmontar o hook só remove listeners —
 * a conexão/sessão sobrevive à navegação para fora e de volta ao chat.
 *
 * @param {{ config?: object, surface?: string }} [options] overrides de config
 *   (precedência máxima) e superfície do chat ('home', 'account', ...)
 */
export default function useWeniChat(options = {}) {
	const [config, setConfig] = useState(() => getChatConfig())
	const [messages, setMessages] = useState([])
	const [connectionStatus, setConnectionStatus] = useState('disconnected')
	const [isTyping, setIsTyping] = useState(false)
	const [isThinking, setIsThinking] = useState(false)
	const [isReady, setIsReady] = useState(false)
	const [error, setError] = useState(null)
	const [diag, setDiag] = useState([])
	const [voiceAvailable, setVoiceAvailable] = useState(false)
	const [isDictating, setIsDictating] = useState(false)
	const [partialText, setPartialText] = useState('')
	const [speechLevel, setSpeechLevel] = useState(0)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)

	const decayRef = useRef(null)
	const partialRef = useRef('') // último texto reconhecido (cumulativo)
	const dictatingRef = useRef(false) // protege finalize() contra dupla execução
	const dictationModeRef = useRef(null) // 'stream' | 'oneshot'
	const stopTimerRef = useRef(null)
	const serviceRef = useRef(null)
	const pageRef = useRef(1)
	// Overrides capturados no primeiro render: a config é resolvida uma vez por
	// montagem (mudar overrides em runtime exige remontar o chat).
	const overridesRef = useRef(options.config)
	const surfaceRef = useRef(options.surface)

	useEffect(() => {
		let mounted = true
		let service = null
		let diagTimer = null
		const bound = []

		const bind = (event, fn) => {
			service.on(event, fn)
			bound.push([event, fn])
		}

		const refreshDiag = () => {
			if (mounted) setDiag(getDiag())
		}

		loadChatConfig(overridesRef.current)
			.then(resolved => {
				if (!mounted) return null
				setConfig(resolved)
				// Painel de debug atualiza por polling, independente do init resolver.
				if (resolved.debug) diagTimer = setInterval(refreshDiag, 1000)
				refreshDiag()

				isVoiceAvailable()
					.then(available => mounted && setVoiceAvailable(available))
					.catch(() => {})

				return initChat(surfaceRef.current)
			})
			.then(s => {
				if (!mounted || !s) return
				service = s
				serviceRef.current = s

				const refreshMessages = () => setMessages([...s.getMessages()])

				refreshMessages()
				setConnectionStatus(s.getConnectionStatus())
				setIsReady(true)
				refreshDiag()

				// Reentrada no chat: se o singleton perdeu o socket, religa; e
				// revalida o token de sessão VTEX (pode ter rotacionado).
				ensureConnected()
				syncCustomFields()

				bind(SERVICE_EVENTS.STATE_CHANGED, refreshMessages)
				bind(SERVICE_EVENTS.MESSAGE_RECEIVED, refreshMessages)
				bind(SERVICE_EVENTS.MESSAGE_SENT, refreshMessages)
				bind(SERVICE_EVENTS.MESSAGE_UPDATED, refreshMessages)
				bind(SERVICE_EVENTS.HISTORY_LOADED, refreshMessages)
				bind(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, status => {
					setConnectionStatus(status)
					refreshDiag()
				})
				bind(SERVICE_EVENTS.TYPING_START, () => setIsTyping(true))
				bind(SERVICE_EVENTS.TYPING_STOP, () => setIsTyping(false))
				bind(SERVICE_EVENTS.THINKING_START, () => setIsThinking(true))
				bind(SERVICE_EVENTS.THINKING_STOP, () => setIsThinking(false))
				bind(SERVICE_EVENTS.ERROR, err => {
					setError(err)
					refreshDiag()
				})
			})
			.catch(err => {
				if (mounted) {
					setError(err)
					refreshDiag()
				}
			})

		return () => {
			mounted = false
			if (diagTimer) clearInterval(diagTimer)
			if (decayRef.current) clearInterval(decayRef.current)
			if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
			if (service) {
				bound.forEach(([event, fn]) => service.off(event, fn))
			}
		}
	}, [])

	const sendMessage = useCallback(text => {
		const service = serviceRef.current
		if (service && typeof text === 'string' && text.trim()) {
			service.sendMessage(text.trim())
		}
	}, [])

	/**
	 * Envia o título de um quick reply / item de lista como resposta do usuário.
	 * @param {{title?: string, text?: string, payload?: string}} option
	 */
	const sendReply = useCallback(option => {
		const service = serviceRef.current
		if (!service) return
		const text = option?.title || option?.text || option?.payload || ''
		if (text) service.sendMessage(text)
	}, [])

	// Finaliza o ditado exatamente uma vez: para timers, reseta a UI e envia o
	// texto reconhecido. Protegido contra `final` tardio + stop manual.
	const finalizeDictation = useCallback(text => {
		if (!dictatingRef.current) return
		dictatingRef.current = false
		if (decayRef.current) {
			clearInterval(decayRef.current)
			decayRef.current = null
		}
		if (stopTimerRef.current) {
			clearTimeout(stopTimerRef.current)
			stopTimerRef.current = null
		}
		const finalText = text || partialRef.current
		partialRef.current = ''
		setSpeechLevel(0)
		setPartialText('')
		setIsDictating(false)
		if (finalText && serviceRef.current) serviceRef.current.sendMessage(finalText)
	}, [])

	/**
	 * Inicia o ditado por voz (streaming). O texto parcial alimenta `speechLevel`
	 * (sinal 0..1 de atividade de fala para o waveform); o texto final é enviado
	 * automaticamente. Não há amplitude real de áudio no Eitri — o nível
	 * acompanha a chegada de palavras.
	 */
	const dictate = useCallback(() => {
		if (dictatingRef.current) return
		dictatingRef.current = true
		dictationModeRef.current = null
		partialRef.current = ''
		setIsDictating(true)
		setPartialText('')
		setSpeechLevel(0)

		// Decai o nível entre parciais (a onda assenta no silêncio).
		if (decayRef.current) clearInterval(decayRef.current)
		decayRef.current = setInterval(() => {
			setSpeechLevel(prev => (prev > 0 ? Math.max(0, prev - 0.1) : 0))
		}, 110)

		startDictation({
			onPartial: text => {
				if (text) partialRef.current = text
				setPartialText(text || '')
				setSpeechLevel(1)
			},
			onFinal: text => finalizeDictation(text)
		}).then(mode => {
			dictationModeRef.current = mode
		})
	}, [finalizeDictation])

	// "Concluir": para o reconhecimento nativo e finaliza. No streaming já temos
	// o texto cumulativo; no one-shot damos uma janela curta para o resultado.
	const stopDictate = useCallback(() => {
		if (!dictatingRef.current) return
		stopDictation()
		if (dictationModeRef.current === 'stream') {
			finalizeDictation(partialRef.current)
		} else {
			if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
			stopTimerRef.current = setTimeout(() => finalizeDictation(partialRef.current), 1200)
		}
	}, [finalizeDictation])

	const reconnect = useCallback(() => ensureConnected(), [])
	const newConversation = useCallback(() => startNewConversation(), [])

	/**
	 * Carrega a próxima página (mais antiga) do histórico.
	 */
	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore || !serviceRef.current) return
		setLoadingMore(true)
		try {
			const nextPage = pageRef.current + 1
			const older = await loadHistoryPage(nextPage)
			pageRef.current = nextPage
			if (!Array.isArray(older) || older.length < 20) setHasMore(false)
			setMessages([...serviceRef.current.getMessages()])
		} catch (err) {
			setHasMore(false)
		} finally {
			setLoadingMore(false)
		}
	}, [loadingMore, hasMore])

	return {
		config,
		messages,
		connectionStatus,
		isConnected: connectionStatus === 'connected',
		isTyping,
		isThinking,
		isReady,
		error,
		diag,
		voiceAvailable,
		isDictating,
		partialText,
		speechLevel,
		loadingMore,
		hasMore,
		sendMessage,
		sendReply,
		reconnect,
		newConversation,
		dictate,
		stopDictate,
		loadMore,
		sendCameraPhoto,
		sendGalleryImage,
		sendDocument,
		service: serviceRef.current
	}
}
