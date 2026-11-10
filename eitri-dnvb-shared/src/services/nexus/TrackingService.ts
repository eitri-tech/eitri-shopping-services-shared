import { NexusError } from '../../errors/NexusError'
import NexusCaller from './NexusCaller'

const EVENT_KEY = /^[A-Za-z0-9_.:-]{1,128}$/
const MAX_PENDING = 50

interface PendingEvent {
	eventKey: string
	data: Record<string, unknown>
	at: string
}

/**
 * Eventos não enviados (sem sessão ou falha de rede) ficam em memória, até `MAX_PENDING` descartando os
 * mais antigos, e saem no próximo `track` que conseguir enviar.
 */
let pending: PendingEvent[] = []
let flushing: Promise<void> = Promise.resolve()

const send = (event: PendingEvent) =>
	NexusCaller.requestIfRegistered('post', '/events', {
		eventKey: event.eventKey,
		data: { ...event.data, occurredAt: event.at }
	})

/** Payload rejeitado (400) descarta só aquele evento; sem sessão ou rede, a fila espera o próximo `track`. */
const flush = (): Promise<void> => {
	flushing = flushing.then(async () => {
		while (pending.length) {
			const event = pending[0]
			try {
				await send(event)
			} catch (e) {
				if (!(e instanceof NexusError && e.code === 'INVALID_PAYLOAD')) return
				console.warn('[nexus] evento rejeitado, descartando', event.eventKey, e)
			}
			pending = pending.filter(item => item !== event)
		}
	})
	return flushing
}

export default class TrackingService {
	/** Fire-and-forget: nunca lança e nunca registra uma instalação. */
	static track(eventKey: string, data?: Record<string, unknown>): void {
		if (typeof eventKey !== 'string' || !EVENT_KEY.test(eventKey)) {
			console.warn('[nexus] eventKey inválido', eventKey)
			return
		}
		pending = [...pending, { eventKey, data: data ?? {}, at: new Date().toISOString() }].slice(-MAX_PENDING)
		void flush()
	}
}
