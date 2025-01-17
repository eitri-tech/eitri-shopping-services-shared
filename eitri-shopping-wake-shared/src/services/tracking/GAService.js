import Eitri from 'eitri-bifrost'
import WakeService from "../WakeService";

export default class GAService {
	static logScreenView = (currentPage, pageClass = '') => {
		try {
			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.currentScreen) {
				Eitri.exposedApis.fb.currentScreen({ screen: currentPage, screenClass: pageClass })
        if (WakeService.configs.gaVerbose) {
          console.log('[Analytics]', '[logScreenView]', { screen: currentPage, screenClass: pageClass })
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

		try {

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logEvent) {
				Eitri.exposedApis.fb.logEvent({ eventName: event, data: params })
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

	static logError = (event, error) => {
		let params = {
			currentPage: document.title,
			event,
			...error
		}
		try {

			if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logError) {
				Eitri.exposedApis.fb.logError({ message: params })
        if (WakeService.configs.gaVerbose) {
          console.log('[Analytics]', '[logError]', { message: params })
        }
			} else {
        console.error('[Analytics] Eitri.exposedApis.fb.logError not available')
      }

    } catch (error) {
			console.error('[Analytics] Error on logError', error.message)
		}
	}

}
