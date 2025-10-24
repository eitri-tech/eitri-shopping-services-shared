import Eitri from 'eitri-bifrost'

export const sendDatadogLog = async (data = {}, method) => {
	try {
		const environment = await Eitri.environment.getName()
		if (environment === 'dev') return

		const payload = {
			origin: 'APP-SHOPPING',
			eventName: `${window.__eitriAppConf?.slug}`,
			slug: `${window.__eitriAppConf?.slug}`,
			version: window.__eitriAppConf?.version,
			data: {
				app: window.__eitriAppConf?.app || '',
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
		const environment = await Eitri.environment.getName()
		if (environment === 'dev') return

		const device = await Eitri.device.getInfos()

		const payload = {
			origin: 'APP-SHOPPING-ORDER-ACCEPTED',
			eventName: window.__eitriAppConf?.slug,
			data: {
				app: window.__eitriAppConf?.app || '',
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
				})
			}
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
		const environment = await Eitri.environment.getName()
		if (environment === 'dev') return

		const device = await Eitri.device.getInfos()

		const payload = {
			origin: 'APP-SHOPPING',
			eventName: `${window.__eitriAppConf?.slug}`,
			slug: `${window.__eitriAppConf?.slug}`,
			version: window.__eitriAppConf?.version,
			data: {
				app: window.__eitriAppConf?.app || '',
				applicationId: window.__eitriAppConf?.applicationId,
				device,
				method: method || '',
				error: {
					message: error?.message,
					stack: error?.stack,
					name: error?.name,
					...error
				},
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
