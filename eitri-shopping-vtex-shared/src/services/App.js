import Eitri from 'eitri-bifrost'
import Vtex from './Vtex'
import EventBus from '@/services/EventBus'
import RemoteConfig from './RemoteConfig'
import VtexSessionService from '@/services/vtex/session/vtexSessionService'
import VtexCustomerService from '@/services/vtex/customer/vtexCustomerService'

let loaded = false

export default class App {
	static configs = null

	static configure = async overwrites => {
		if (loaded) {
			return
		}

		const remoteConfig = await RemoteConfig.init({
			...overwrites,
			newSessionFlow: true
		})

		console.log('[SHARED] ********* Config Vtex encontrada, configurando automaticamente *******')
		console.log('[SHARED] Account ======>', remoteConfig.providerInfo.account)
		console.log('[SHARED] Host ======>', remoteConfig.providerInfo.host)

		App.setStatusBarColor(RemoteConfig.getContent('appConfigs.statusBarTextColor'))
		App.startClarity(RemoteConfig.getContent('appConfigs.clarityId'))
		App.setAppName(RemoteConfig.getContent('appConfigs.appName'))
		App.configs = RemoteConfig.content

		console.log('[SHARED] *********** App configurado com sucesso ************')

		loaded = true

		await Vtex.startVtexParams(remoteConfig)

		return App.configs
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

	static setAppName(appName) {
		try {
			if (!appName) return
			window.__eitriAppConf.application = appName
		} catch (error) {
			console.error('[SHARED] Error ao setar nome do App', error)
		}
	}

}
