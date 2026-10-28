import Eitri from 'eitri-bifrost'
import Logger from './_helpers/Logger'

declare global {
	interface Window {
		__eitriAppConf?: {
			application?: string
			slug?: string
			applicationId?: string
			version?: string
		}
	}
}

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g

const sanitizeHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
	const sanitized: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value !== 'string') {
			sanitized[key] = value
			continue
		}
		sanitized[key] = value.replace(JWT_PATTERN, '[JWT_REDACTED]')
	}
	return sanitized
}

const sanitizeError = (error: unknown): Record<string, unknown> => {
	try {
		if (!error || typeof error !== 'object') return {}
		const err = error as Record<string, any>
		const sanitized: Record<string, unknown> = { ...err }
		if (sanitized.request?.headers) {
			sanitized.request = { ...(sanitized.request as object), headers: sanitizeHeaders(err.request.headers) }
		}
		if (sanitized.response?.headers) {
			sanitized.response = { ...(sanitized.response as object), headers: sanitizeHeaders(err.response.headers) }
		}
		return sanitized
	} catch {
		return {}
	}
}

let _cachedDeviceAndSession: { deviceId: string | null; sessionId: string | null } | null = null

const getDeviceAndSession = async () => {
	if (_cachedDeviceAndSession) return _cachedDeviceAndSession
	const deviceId = await Eitri.sharedStorage.getItem('device_id')
	const sessionId = await Eitri.sharedStorage.getItem('session_id')
	const result = { deviceId, sessionId }
	if (deviceId && sessionId) {
		_cachedDeviceAndSession = result
	}
	return result
}

const postEvent = async (payload: Record<string, unknown>): Promise<void> => {
	const environment = await Eitri.environment.getName()
	if (environment === 'dev') {
		Logger.log(`===${payload.origin}===`, payload)
		return
	}
	Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
		'Content-Type': 'application/json',
		'application-id': window.__eitriAppConf?.applicationId
	})
}

type CartContext = {
	id?: string
	buyerIdentity?: { email?: string }
}

type OrderContext = {
	cartId?: string
	value?: string | number
	email?: string
	items?: Array<{
		id?: string
		name?: string
		price?: string | number
		imageUrl?: string
	}>
	[key: string]: unknown
}

export const sendDatadogWarningLog = async (data: Record<string, unknown> = {}, method?: string): Promise<void> => {
	try {
		const { deviceId, sessionId } = await getDeviceAndSession()

		await postEvent({
			origin: 'APP-SHOPPING-WARNING',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				method: method || '',
				...data
			}
		})
	} catch (e) {
		console.error('Erro sendDatadogWarningLog', e)
	}
}

export const sendDatadogInfoLog = async (data: Record<string, unknown> = {}, method?: string): Promise<void> => {
	try {
		const { deviceId, sessionId } = await getDeviceAndSession()

		await postEvent({
			origin: 'APP-SHOPPING-INFO',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				method: method || '',
				...data
			}
		})
	} catch (e) {
		console.error('Erro sendDatadogInfoLog', e)
	}
}

export const sendLogOrderAccepted = async (order: OrderContext = {}): Promise<void> => {
	try {
		const [device, { deviceId, sessionId }] = await Promise.all([Eitri.device.getInfos(), getDeviceAndSession()])

		await postEvent({
			origin: 'APP-SHOPPING-ORDER-ACCEPTED',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				platform: (device as any)?.platform,
				...order
			}
		})
	} catch (e) {
		console.error('Erro sendLogOrderAccepted', e)
	}
}

export const sendLogError = async (
	error: unknown,
	method?: string,
	data: Record<string, unknown> = {},
	cart?: CartContext
): Promise<void> => {
	try {
		const [device, { deviceId, sessionId }] = await Promise.all([Eitri.device.getInfos(), getDeviceAndSession()])

		await postEvent({
			origin: 'APP-SHOPPING-ERROR',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				device,
				method: method || '',
				email: cart?.buyerIdentity?.email,
				cartId: cart?.id,
				error:
					typeof error === 'string'
						? { message: error }
						: {
								message: (error as any)?.message,
								stack: (error as any)?.stack,
								name: (error as any)?.name,
								...sanitizeError(error)
							},
				...data
			}
		})
	} catch (e) {
		console.error('Erro sendLogError', e)
	}
}

export const sendOrderNotComplete = async (
	error: unknown,
	method?: string,
	data: Record<string, unknown> = {},
	cart?: CartContext
): Promise<void> => {
	try {
		const [device, { deviceId, sessionId }] = await Promise.all([Eitri.device.getInfos(), getDeviceAndSession()])

		await postEvent({
			origin: 'APP-SHOPPING-ORDER-NOT-COMPLETED',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				device,
				method: method || '',
				email: cart?.buyerIdentity?.email,
				cartId: cart?.id,
				error:
					typeof error === 'string'
						? { message: error }
						: {
								message: (error as any)?.message,
								stack: (error as any)?.stack,
								name: (error as any)?.name,
								...sanitizeError(error)
							},
				...data
			}
		})
	} catch (e) {
		console.error('Erro sendOrderNotComplete', e)
	}
}
