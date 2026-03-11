import Eitri from 'eitri-bifrost'
import App from '../App'

export default class GAService {
	static logScreenView = (currentPage, pageClass = '') => {
		try {
			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.currentScreen) {
				Eitri.exposedApis.fb.currentScreen({
					screen: currentPage,
					screenClass: pageClass
				})
				if (App.configs.gaVerbose) {
					console.log('[Analytics]', '[logScreenView]', {
						screen: currentPage,
						screenClass: pageClass
					})
				}
			} else {
				console.log('[Analytics] Eitri.exposedApis.fb.logScreenView not available')
			}
		} catch (error) {
			console.error('[Analytics] Error on logScreenView', error.message)
		}
	}

	static logEvent = (event, data) => {
		let params = {
			screen: document.title,
			...data
		}

		console.log('VALIDATE EVENT [PURCHASE (logEvent)] - PARAMS', params)

		// tentativa pelo fb
		try {
			console.log('VALIDATE EVENT [PURCHASE (logEvent)] - gaVerbose', App.configs.gaVerbose)

			Eitri.exposedApis.fb.logEvent({ eventName: event, data: params })

			console.log('VALIDATE EVENT [PURCHASE (logEvent)] - PASSOU DA LINHA')
			if (App.configs.gaVerbose) {
				console.log('[Analytics]', '[logEvent]', {
					eventName: event,
					data: params
				})
			}
			return
		} catch (error) {
			console.error('[Analytics] Error on logEvent', error.message)
		}
	}

	static logError = (event, error) => {
		let params = {
			currentPage: document.title,
			event,
			...error
		}
		try {
			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logError) {
				Eitri.exposedApis.fb.logError({ message: params })
				if (App.configs.gaVerbose) {
					console.log('[Analytics]', '[logError]', { message: params })
				}
			} else {
				console.error('[Analytics] Eitri.exposedApis.fb.logError not available')
			}
		} catch (error) {
			console.error('[Analytics] Error on logError', error.message)
		}
	}

	static sendCampaignDetails = segments => {
		if (!segments) return null

		const utmParams = {}
		for (const key of Object.keys(segments)) {
			const normalizedKey = key.replace(/[_-]/g, '').toLowerCase()

			if (normalizedKey.startsWith('utm')) {
				if (normalizedKey === 'utmcampaignid') {
					utmParams['campaign_id'] = segments[key]
				} else {
					utmParams[normalizedKey.substring(3)] = segments[key]
				}
			}
		}

		if (Object.keys(utmParams).length > 0) {
			GAService.logEvent('campaign_details', utmParams)
		}
	}

	// TODO: Implementar métodos de ecommerce para GA (https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag)
}
