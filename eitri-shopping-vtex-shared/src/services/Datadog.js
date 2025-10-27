import Eitri from 'eitri-bifrost'
import VtexCartService from '@/services/vtex/cart/VtexCartService'
import Logger from '@/services/Logger'

export const sendDatadogWarningLog = async (data = {}, method) => {
	try {

		const payload = {
			origin: 'APP-SHOPPING-WARNING',
			eventName: `${window.__eitriAppConf?.slug}`,
			slug: `${window.__eitriAppConf?.slug}`,
			version: window.__eitriAppConf?.version,
			data: {
				application: window.__eitriAppConf?.application || '',
				applicationId: window.__eitriAppConf?.applicationId,
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
			slug: `${window.__eitriAppConf?.slug}`,
			version: window.__eitriAppConf?.version,
			data: {
				application: window.__eitriAppConf?.application || '',
				applicationId: window.__eitriAppConf?.applicationId,
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

export const sendLogError = async (error, method, data = {}) => {
	try {

		const device = await Eitri.device.getInfos()

		const cart = VtexCartService._CACHED_CART

		const payload = {
			origin: 'APP-SHOPPING-ERROR',
			eventName: `${window.__eitriAppConf?.slug}`,
			slug: `${window.__eitriAppConf?.slug}`,
			version: window.__eitriAppConf?.version,
			data: {
				application: window.__eitriAppConf?.application || '',
				applicationId: window.__eitriAppConf?.applicationId,
				device,
				method: method || '',
				email: cart?.clientProfileData?.email,
				cartId: cart?.orderFormId,
				error: {
					message: error?.message,
					stack: error?.stack,
					name: error?.name,
					...error
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
