import Eitri from 'eitri-bifrost'
import Logger from '../Logger'
import WakeService from "../WakeService";

export default class GAService {
	static logScreenView = (currentPage, pageClass = '') => {
		try {

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logScreenView) {
				Eitri.exposedApis.fb.logScreenView({ screen: currentPage, screenClass: pageClass })
			}

      if (WakeService.configs.gaVerbose) {
        console.log('[Analytics]', '[logScreenView]', { screen: currentPage, screenClass: pageClass })
      }
		} catch (error) {
			this.logError('logScreenView', error.message)
		}
	}

	static logEvent = (event, data) => {
		let params = {
			screen: document.title,
			...data
		}

		try {

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logEvent) {
				Eitri.exposedApis.fb.logEvent({ eventName: event, data: params })
        console.log('[Analytics]', '[logEvent]', WakeService.configs)
        if (WakeService.configs.gaVerbose) {
          console.log('[Analytics]', '[logEvent]', { eventName: event, data: params })
        }
			} else {
        console.error('[Analytics] Eitri.exposedApis.fb.logEvent not available')
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

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logError) {
				Eitri.exposedApis.fb.logError({ message: params })
			}

      if (WakeService.configs.gaVerbose) {
        console.log('[Analytics]', '[logError]', { message: params })
      }

    } catch (error) {
			console.error('logError', error.message)
		}
	}

}
