import Eitri from 'eitri-bifrost'

export const sendDatadogLog = async (method, error, data = {}) => {
	try {
		const environment = await Eitri.environment.getName()
		if (environment === 'dev') return

		const payload = {
			origin: 'APP-SHOPPING',
			eventName: `${window.__eitriAppConf?.slug}`,
			slug: `${window.__eitriAppConf?.slug}`,
			version: window.__eitriAppConf?.version,
			data: {
				app: 'SHARED',
				applicationId: window.__eitriAppConf?.applicationId,
				method: method || '',
				error: error
					? {
							message: error?.message,
							stack: error?.stack,
							name: error?.name,
							...error
						}
					: null,
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
