import Eitri from 'eitri-bifrost'
import VtexCartService from '@/services/vtex/cart/VtexCartService'
import Logger from '@/services/Logger'

const AUTH_COOKIES = ['VtexIdclientAutCookie', 'CheckoutDataAccess', 'Vtex_CHKO_Auth', 'vtex_session']
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g

const sanitizeHeaders = headers => {
	const sanitized = {}
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value !== 'string') {
			sanitized[key] = value
			continue
		}
		let clean = value.replace(JWT_PATTERN, '[JWT_REDACTED]')
		if (key.toLowerCase() === 'cookie') {
			clean = clean
				.split(';')
				.map(cookie => {
					const [name, ...rest] = cookie.split('=')
					const isAuth = AUTH_COOKIES.some(authName => name.trim().startsWith(authName))
					return isAuth && rest.length ? `${name}=[REDACTED]` : cookie
				})
				.join(';')
		}
		sanitized[key] = clean
	}
	return sanitized
}

const sanitizeError = error => {
	if (!error || typeof error !== 'object') return error
	const sanitized = { ...error }
	if (sanitized.request?.headers) {
		sanitized.request = { ...sanitized.request, headers: sanitizeHeaders(sanitized.request.headers) }
	}
	if (sanitized.response?.headers) {
		sanitized.response = { ...sanitized.response, headers: sanitizeHeaders(sanitized.response.headers) }
	}
	return sanitized
}

export const sendDatadogWarningLog = async (data = {}, method) => {
	try {

		const payload = {
			origin: 'APP-SHOPPING-WARNING',
			eventName: `${window.__eitriAppConf?.slug}`,
			data: {
                application: window.__eitriAppConf?.application || '',
                slug: window.__eitriAppConf?.slug,
                applicationId: window.__eitriAppConf?.applicationId,
                version: window.__eitriAppConf?.version,
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

		const payload = {
			origin: 'APP-SHOPPING-INFO',
			eventName: `${window.__eitriAppConf?.slug}`,
			data: {
                application: window.__eitriAppConf?.application || '',
                slug: window.__eitriAppConf?.slug,
                applicationId: window.__eitriAppConf?.applicationId,
                version: window.__eitriAppConf?.version,
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

		const device = await Eitri.device.getInfos()

		const payload = {
			origin: 'APP-SHOPPING-ORDER-ACCEPTED',
			eventName: window.__eitriAppConf?.slug,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				cartId: cart?.orderFormId,
				value: (cart.value / 100).toFixed(2),
				platform: device?.platform,
				state: cart?.shippingData?.address?.state,
				city: cart?.shippingData?.address?.city,
				items: cart?.items?.map(item => {
					return {
						id: item.id,
						productId: item.productId,
						name: item.name,
						price: (item.price / 100).toFixed(2),
						imageUrl: item.imageUrl
					}
				}),
				payments: cart?.paymentData?.payments?.map(payment => {
					const paymentSystem = cart?.paymentData?.paymentSystems?.find(
						ps => ps.stringId === payment.paymentSystem
					)
					return {
						paymentSystemName: paymentSystem?.name || 'N/D'
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
		console.error('Erro sendLogOrderAccepted', e)
	}
}

export const sendLogError = async (error, method, data = {}, _cart) => {
	try {

		const device = await Eitri.device.getInfos()

		const cart = _cart || VtexCartService._CACHED_CART

		const payload = {
			origin: 'APP-SHOPPING-ERROR',
			eventName: `${window.__eitriAppConf?.slug}`,
			data: {
                application: window.__eitriAppConf?.application || '',
                slug: window.__eitriAppConf?.slug,
                applicationId: window.__eitriAppConf?.applicationId,
                version: window.__eitriAppConf?.version,
                device,
				method: method || '',
				email: cart?.clientProfileData?.email,
				cartId: cart?.orderFormId,
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
		console.error('Erro sendLogError', e)
	}
}

export const sendOrderNotComplete = async (error, method, data = {}, _cart) => {
	try {

		const device = await Eitri.device.getInfos()

		const cart = _cart || VtexCartService._CACHED_CART

		const payload = {
			origin: 'APP-SHOPPING-ORDER-NOT-COMPLETED',
			eventName: `${window.__eitriAppConf?.slug}`,
			data: {
				application: window.__eitriAppConf?.application || '',
				slug: window.__eitriAppConf?.slug,
				applicationId: window.__eitriAppConf?.applicationId,
				version: window.__eitriAppConf?.version,
				device,
				method: method || '',
				email: cart?.clientProfileData?.email,
				cartId: cart?.orderFormId,
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
		console.error('Erro sendLogError', e)
	}
}
