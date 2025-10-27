import Eitri from 'eitri-bifrost'
import CartService from '@/services/CartService'

export const sendDatadogWarningLog = async (data = {}, method) => {
	try {
		const environment = await Eitri.environment.getName()
		if (environment === 'dev') return

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

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro ao setar user', e)
	}
}

export const sendDatadogInfoLog = async (data = {}, method) => {
	try {
		const environment = await Eitri.environment.getName()
		if (environment === 'dev') return

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

		Eitri.http.post('https://api.eitri.tech/analytics/event', payload, {
			'Content-Type': 'application/json',
			'application-id': window.__eitriAppConf?.applicationId
		})
	} catch (e) {
		console.error('Erro ao setar user', e)
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
			console.log('Log payload', payload)
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

		const device = await Eitri.device.getInfos()

		const checkout = CartService.CACHED_CART

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
				email: checkout?.customer?.email || '',
				cartId: checkout?.checkoutId || '',
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
			console.log('Error', payload)
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
