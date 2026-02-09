import RemoteConfig from './RemoteConfig'

export default class App {
	static async configure(overwrites: any = null) {
		await RemoteConfig.init(overwrites)
		App.setStatusBarColor(RemoteConfig.getContent('appConfigs.statusBarTextColor'))
	}

	static setStatusBarColor(color: string) {
		if (color) {
			const _color = color === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
			window.EITRI.connector.invokeMethod(_color)
		}
	}
}
