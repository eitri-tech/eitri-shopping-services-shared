import RemoteConfig from './RemoteConfig'
import Eitri from 'eitri-bifrost'

export default class App {
	static async configure(overwrites: any = null) {
		await RemoteConfig.init(overwrites)
		App.setStatusBarColor(RemoteConfig.getContent('appConfigs.statusBarTextColor'))
		App.startClarity(RemoteConfig.getContent('appConfigs.clarityId'))
	}

	static setStatusBarColor(color: string) {
		if (color) {
			const _color = color === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
			window.EITRI.connector.invokeMethod(_color)
		}
	}

	static startClarity(clarityId: string) {
		try {
			if (clarityId) {
				Eitri.tracking.clarity.init(clarityId)
			}
		} catch (error) {
			console.error('[SHARED] Error ao inicializar Clarity', error)
		}
	}
}
