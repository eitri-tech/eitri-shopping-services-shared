import Eitri from 'eitri-bifrost'
import Logger from '../Logger'

export default class GAService {
	static logScreenView = (currentPage, pageClass = '') => {
		try {
			Logger.log('[Analytics]', '[logScreenView]', { screen: currentPage, screenClass: pageClass })

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logScreenView) {
				Eitri.exposedApis.fb.logScreenView({ screen: currentPage, screenClass: pageClass })
			}
		} catch (error) {
			this.logError('logScreenView', error.message)
		}
	}

	static logEvent = (event, currentPage, data) => {
		let params = {
			screen: currentPage,
			...data
		}

		try {
			Logger.log('[Analytics]', '[logEvent]', { eventName: event, data: params })

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logEvent) {
				Eitri.exposedApis.fb.logEvent({ eventName: event, data: params })
			}
		} catch (error) {
			this.logError('logEvent', error.message)
		}
	}

	static logError = (event, error, currentPage = null) => {
		let params = {
			currentPage,
			event,
			...error
		}
		try {
			Logger.log('[Analytics]', '[logError]', { message: params })

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logError) {
				Eitri.exposedApis.fb.logError({ message: params })
			}
		} catch (error) {
			console.error('logError', error.message)
		}
	}
}
