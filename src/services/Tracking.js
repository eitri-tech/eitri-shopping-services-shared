import Eitri from 'eitri-bifrost'
import GAService from './tracking/GAService'
import ClarityService from './tracking/ClarityService'

export default class Tracking {
	static configs = {
		clarity: '',
		verbose: false
	}

	static configure = configs => {
		const { clarityProjectId, triggerAutoEvents, verbose } = configs

		Tracking.configs = {
			...Tracking.configs,
			clarityProjectId,
			triggerAutoEvents: triggerAutoEvents ?? true
		}

		if (Tracking.configs.clarityProjectId) {
			ClarityService.init(Tracking.configs.clarityProjectId)
		}
	}

	static tryAutoConfigure = async overwrites => {
		try {
			const remoteConfig = await Eitri.environment.getRemoteConfigs()
			if (remoteConfig.trackingConfig) {
				console.log(
					'[TRACKING] Configurações de tracking encontradas, configurando automaticamente',
					remoteConfig?.trackingConfig
				)

				Tracking.configure({
					...remoteConfig?.trackingConfig,
					...overwrites
				})

				return true
			}
			return false
		} catch (error) {
			console.error('Error trying to auto configure Tracking', error)
			return false
		}
	}

	static ga = GAService
	static clarity = ClarityService
}
