import Eitri from 'eitri-bifrost'
import ClarityService from './tracking/ClarityService'
import Logger from './Logger'

export default class App {
	static configs = {
		verbose: false,
		gaVerbose: false
	}

	static tryAutoConfigure = async overwrites => {
		console.log('[SHARED] Iniciando autoconfiguração do App...')
		
		let remoteConfig
		try {
			console.log('[SHARED] Obtendo configurações remotas...')
			const _remoteConfig = await Eitri.environment.getRemoteConfigs()
			remoteConfig = { ..._remoteConfig, ...overwrites }
			console.log('[SHARED] Configurações remotas obtidas com sucesso')
		} catch (error) {
			console.error('[SHARED] Error getRemoteConfigs', error)
			throw error
		}

		try {
			console.log('[SHARED] ********* Configurações encontradas, configurando automaticamente *******')
			console.log('[SHARED] Provider ======>', remoteConfig.ecommerceProvider || 'GENERIC')
			console.log('[SHARED] Host ======>', remoteConfig.providerInfo?.host)
			console.log('[SHARED] Configurações do provedor aplicadas')
		} catch (error) {
			console.error('[SHARED] Error ao aplicar configurações do provedor', error)
		}

		try {
			if (remoteConfig?.appConfigs?.clarityId || remoteConfig?.clarityId) {
				const clarityId = remoteConfig?.appConfigs?.clarityId || remoteConfig?.clarityId
				console.log('[SHARED] Inicializando Clarity com ID:', clarityId)
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
				console.log('[SHARED] Configurando cor da status bar:', color)
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

			console.log('[SHARED] Verbose mode:', App.configs.verbose ? 'ATIVADO' : 'DESATIVADO')
			console.log('[SHARED] GA Verbose mode:', App.configs.gaVerbose ? 'ATIVADO' : 'DESATIVADO')
			console.log('[SHARED] *********** App configurado com sucesso ************')

			return App.configs
		} catch (error) {
			console.error('[SHARED] Error App configure ', error)
			throw error
		}
	}
}
