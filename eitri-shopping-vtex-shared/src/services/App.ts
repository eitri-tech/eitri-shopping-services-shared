import Eitri from 'eitri-bifrost'
import { RemoteConfig } from '@/services/types/Config.types'

export default class App {
	static configs: RemoteConfig = null

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
			App.configs = {
				verbose: false,
				gaVerbose: false,
				...remoteConfig
			}
		} catch (error) {
			console.error('[SHARED] Error autoConfigure ', error)
			throw error
		}

		App.initClarity(remoteConfig?.appConfigs?.clarityId || remoteConfig?.clarityId)

		App.setStatusBarTextColor(remoteConfig?.appConfigs?.statusBarTextColor)

		try {
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

	static getAccount = () => {
		return App.configs?.providerInfo?.account
	}

	static getHost = () => {
		let _host = App.configs?.providerInfo?.host
		if (_host && !_host.startsWith('https://')) {
			_host = 'https://' + _host
		}
		return _host
	}

	static getApi = () => {
		const account = App.getAccount()
		return `https://${account}.vtexcommercestable.com.br`
	}

	static getMarketingTag = async () => {
		const remoteConfig: RemoteConfig = await Eitri.environment.getRemoteConfigs()

		if (remoteConfig?.storePreferences?.marketingTag) {
			return remoteConfig?.storePreferences?.marketingTag
		}

		const { applicationData } = await Eitri.getConfigs()
		const plataform = applicationData?.platform

		if (remoteConfig?.storePreferences?.androidMarketingTag && plataform === 'android') {
			return remoteConfig?.storePreferences?.androidMarketingTag
		}

		if (remoteConfig?.storePreferences?.iosMarketingTag && plataform === 'ios') {
			return remoteConfig?.storePreferences?.iosMarketingTag
		}

		return 'eitri-shop'
	}

	static getSearchOptions = () => {
		return App.configs.searchOptions
	}

	static getStoreOptions = () => {
		return App.configs.storePreferences
	}
}
