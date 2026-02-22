import Eitri from 'eitri-bifrost'
import Vtex from './Vtex'
import EventBus from '@/services/EventBus'
import RemoteConfig from './RemoteConfig'

export default class App {
	static configs = {
		verbose: false,
		gaVerbose: false
	}

	static tryAutoConfigure = async overwrites => {
		try {
			console.log('Inicializando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
			EventBus.subscribe({
				channel: Vtex.customer.CHANNEL_UTM_PARAMS_KEY,
				broadcast: true,
				callback: segments => {
					console.log('Executando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
					Vtex.updateSegmentSession(segments)
				}
			})
		} catch (e) {
			console.error('Erro ao configurar eventBus', e)
		}

		const remoteConfig = await RemoteConfig.init(overwrites)

		try {
			console.log('[SHARED] ********* Config Vtex encontrada, configurando automaticamente *******')
			console.log('[SHARED] Account ======>', remoteConfig.providerInfo.account)
			console.log('[SHARED] Host ======>', remoteConfig.providerInfo.host)
			await Vtex.configure(remoteConfig)
		} catch (error) {
			console.error('[SHARED] Error autoConfigure ', error)
			throw error
		}

		App.setStatusBarColor(RemoteConfig.getContent('appConfigs.statusBarTextColor'))
		App.startClarity(RemoteConfig.getContent('appConfigs.clarityId'))

		try {

			App.configs = {
				...App.configs,
				...remoteConfig
			}

			if (!App.configs?.storePreferences?.currencyCode) {
				App.configs = {
					...App.configs,
					storePreferences: {
						...App.configs.storePreferences,
						currencyCode: 'BRL'
					}
				}
			}

			console.log('[SHARED] *********** App configurado com sucesso ************')

			return App.configs
		} catch (error) {
			console.error('[SHARED] Error App configure ', error)
			throw error
		}
	}

	static setStatusBarColor(color) {
		if (color) {
			const _color = color === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
			window.EITRI.connector.invokeMethod(_color)
		}
	}

	static startClarity(clarityId) {
		try {
			if (clarityId) {
				Eitri.tracking.clarity.init(clarityId)
			}
		} catch (error) {
			console.error('[SHARED] Error ao inicializar Clarity', error)
		}
	}
}
