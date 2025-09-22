import Eitri from 'eitri-bifrost'
import Vtex from './Vtex'

export default class App {
	static configs = {
		verbose: false,
		gaVerbose: false
	}

	static mergeOverwrites = (obj1, obj2) => {
		const result = { ...obj1 }
		for (const key in obj2) {
			if (obj2[key] instanceof Object && key in obj1 && obj1[key] instanceof Object) {
				result[key] = App.mergeOverwrites(obj1[key], obj2[key])
			} else {
				result[key] = obj2[key]
			}
		}
		return result
	}

	static initClarity = async clarityId => {
		try {
			if (clarityId) {
				await Eitri.tracking.clarity.init(clarityId)
			}
		} catch (error) {
			console.error('[SHARED] Error ao inicializar Clarity', error)
		}
	}

	static setStatusBarTextColor = async statusBarTextColor => {
		try {
			if (statusBarTextColor) {
				const color = statusBarTextColor === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
				window.EITRI.connector.invokeMethod(color)
			}
		} catch (e) {
			console.error('Erro ao configurar statusBarTextColor', e)
		}
	}

	static tryAutoConfigure = async overwrites => {
		// try {
		// 	console.log('Inicializando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
		// 	Eitri.eventBus.subscribe({
		// 		channel: Vtex.customer.CHANNEL_UTM_PARAMS_KEY,
		// 		broadcast: true,
		// 		callback: segments => {
		// 			console.log('Executando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
		// 			Vtex.updateSegmentSession(segments)
		// 		}
		// 	})
		// } catch (e) {
		// 	console.error('Erro ao configurar eventBus', e)
		// }

		const _remoteConfig = await Eitri.environment.getRemoteConfigs()
		let remoteConfig = App.mergeOverwrites(_remoteConfig, overwrites)

		try {
			console.log('[SHARED] ********* Config Vtex encontrada, configurando automaticamente *******')
			console.log('[SHARED] Account ======>', remoteConfig.providerInfo.account)
			console.log('[SHARED] Host ======>', remoteConfig.providerInfo.host)
			await Vtex.configure(remoteConfig)
		} catch (error) {
			console.error('[SHARED] Error autoConfigure ', error)
			throw error
		}

		App.initClarity(remoteConfig?.appConfigs?.clarityId || remoteConfig?.clarityId)

		App.setStatusBarTextColor(remoteConfig?.appConfigs?.statusBarTextColor)

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
}
