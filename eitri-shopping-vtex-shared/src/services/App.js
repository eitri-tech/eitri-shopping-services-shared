import Eitri from 'eitri-bifrost'
import Vtex from './Vtex'
import ClarityService from './tracking/ClarityService'

export default class App {
	static configs = {
		verbose: false,
		gaVerbose: false
	}

	static tryAutoConfigure = async overwrites => {
		try {
			console.log('Inicializando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
			Eitri.eventBus.subscribe({
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

		let remoteConfig
		try {
			const _remoteConfig = await Eitri.environment.getRemoteConfigs()
			remoteConfig = { ..._remoteConfig, ...overwrites }
		} catch (error) {
			console.error('[SHARED] Error getRemoteConfigs', error)
			throw error
		}

		try {
			console.log('[SHARED] ********* Config Vtex encontrada, configurando automaticamente *******')
			console.log('[SHARED] Account ======>', remoteConfig.providerInfo.account)
			console.log('[SHARED] Host ======>', remoteConfig.providerInfo.host)
			await Vtex.configure(remoteConfig)
		} catch (error) {
			console.error('[SHARED] Error autoConfigure ', error)
			throw error
		}

		try {
			if (remoteConfig?.appConfigs?.clarityId || remoteConfig?.clarityId) {
				const clarityId = remoteConfig?.appConfigs?.clarityId || remoteConfig?.clarityId
				ClarityService.init(clarityId)
			}
		} catch (error) {
			console.error('[SHARED] Error ao inicializar Clarity', error)
		}

		try {
			if (remoteConfig?.appConfigs?.statusBarTextColor) {
				const color =
					remoteConfig.appConfigs.statusBarTextColor === 'white'
						? 'setStatusBarTextWhite'
						: 'setStatusBarTextBlack'
				window.EITRI.connector.invokeMethod(color)
			}

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
}
