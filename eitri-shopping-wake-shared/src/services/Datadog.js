import Eitri from 'eitri-bifrost'
import CartService from '@/services/CartService'
import Logger from '@/services/Logger'
import StorageService from '@/services/StorageService'

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g

const sanitizeError = error => {
	try {
		if (!error || typeof error !== 'object') return error
		const sanitized = { ...error }
		if (sanitized.request?.headers) {
			const cleanHeaders = {}
			for (const [key, value] of Object.entries(sanitized.request.headers)) {
				cleanHeaders[key] = typeof value === 'string' ? value.replace(JWT_PATTERN, '[JWT_REDACTED]') : value
			}
			sanitized.request = { ...sanitized.request, headers: cleanHeaders }
		}
		return sanitized
	} catch (e) {
		return error
	}
}

let _cachedDeviceAndSession = null

const getDeviceAndSession = async () => {
	if (_cachedDeviceAndSession) return _cachedDeviceAndSession
	const deviceId = await StorageService.getStorageItem('device_id')
	const sessionId = await StorageService.getStorageItem('session_id')
	const result = { deviceId, sessionId }
	if (deviceId && sessionId) {
		_cachedDeviceAndSession = result
	}
	return result
}

export const sendDatadogWarningLog = async (data = {}, method) => {
	try {
		const { deviceId, sessionId } = await getDeviceAndSession()

		const payload = {
			origin: 'APP-SHOPPING-WARNING',
			eventName: `${window.__eitriAppConf?.slug}`,
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
		}

		const environment = await Eitri.environment.getName()
		if (environment === 'dev') {
			Logger.log('===Warning===', payload)
			return
		}

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro sendDatadogWarningLog', e)
	}
}

export const sendDatadogInfoLog = async (data = {}, method) => {
	try {
		const { deviceId, sessionId } = await getDeviceAndSession()

		const payload = {
			origin: 'APP-SHOPPING-INFO',
			eventName: `${window.__eitriAppConf?.slug}`,
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
		}

		const environment = await Eitri.environment.getName()
		if (environment === 'dev') {
			Logger.log('===Info===', payload)
			return
		}

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro sendDatadogInfoLog', e)
	}
}

export const sendLogOrderAccepted = async cart => {
	try {
		const [device, { deviceId, sessionId }] = await Promise.all([
			Eitri.device.getInfos(),
			getDeviceAndSession()
		])

		const payload = {
			origin: 'APP-SHOPPING-ORDER-ACCEPTED',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				cartId: cart?.checkoutId,
				value: cart.total,
				platform: device?.platform,
				state: cart?.selectedAddress?.state,
				city: cart?.selectedAddress?.city,
				items: cart?.products?.map(item => {
					return {
						id: item.productVariantId,
						productId: item.productId,
						name: item.name,
						price: item.price,
						imageUrl: item.imageUrl
					}
				}),
				payments: cart?.orders?.map(order => {
					return {
						paymentSystemName: order?.payment?.name || 'N/D'
					}
				})
			}
		}

		const environment = await Eitri.environment.getName()
		if (environment === 'dev') {
			Logger.log('===OrderAccepted===', payload)
			return
		}

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro ao order accepted', e)
	}
}

export const sendLogError = async (error, method, data = {}) => {
	try {
		const [device, { deviceId, sessionId }] = await Promise.all([
			Eitri.device.getInfos(),
			getDeviceAndSession()
		])

		const checkout = CartService.CACHED_CART

		const payload = {
			origin: 'APP-SHOPPING-ERROR',
			eventName: `${window.__eitriAppConf?.slug}`,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				device,
				method: method || '',
				email: checkout?.customer?.email || '',
				cartId: checkout?.checkoutId || '',
				error:
					typeof error === 'string'
						? { message: error }
						: {
								message: error?.message,
								stack: error?.stack,
								name: error?.name,
								...sanitizeError(error)
						  },
				...data
			}
		}

		const environment = await Eitri.environment.getName()
		if (environment === 'dev') {
			Logger.warn('===sendLogError===', payload)
			return
		}

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro ao enviar log', e)
	}
}

export const sendOrderNotComplete = async (error, method, data = {}) => {
	try {
		const [device, { deviceId, sessionId }] = await Promise.all([
			Eitri.device.getInfos(),
			getDeviceAndSession()
		])

		const checkout = CartService.CACHED_CART

		const payload = {
			origin: 'APP-SHOPPING-ORDER-NOT-COMPLETED',
			eventName: `${window.__eitriAppConf?.slug}`,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				deviceId,
				sessionId,
				device,
				method: method || '',
				email: checkout?.customer?.email || '',
				cartId: checkout?.checkoutId || '',
				error:
					typeof error === 'string'
						? { message: error }
						: {
								message: error?.message,
								stack: error?.stack,
								name: error?.name,
								...sanitizeError(error)
						  },
				...data
			}
		}

		const environment = await Eitri.environment.getName()
		if (environment === 'dev') {
			Logger.warn('===sendOrderNotComplete===', payload)
			return
		}

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro ao enviar sendOrderNotComplete', e)
	}
}
