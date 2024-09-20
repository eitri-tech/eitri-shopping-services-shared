import Eitri from 'eitri-bifrost'
import Vtex from "./Vtex";
import ClarityService from "./tracking/ClarityService";

export default class App {

	static configs = {
		verbose: false,
    clarityId: '',
    autoTriggerGAEvents: true,
    appConfigs: {},
    provider: ''
	}

	static tryAutoConfigure = async overwrites => {
		try {
			const _remoteConfig = await Eitri.environment.getRemoteConfigs()

      const remoteConfig = { ..._remoteConfig, ...overwrites }

			if (remoteConfig.ecommerceProvider === 'VTEX') {
				console.log('[SHARED] Provider Vtex encontrado, configurando automaticamente. Account:', remoteConfig.providerInfo.account, 'Host:', remoteConfig.providerInfo.host)
        App.configs.provider = 'VTEX'
				await Vtex.configure(remoteConfig)
			}

      if (remoteConfig.clarityId) {
        App.configs.clarityId = remoteConfig.clarityId
        ClarityService.init(remoteConfig.clarityId)
      }

      if (remoteConfig?.appConfigs?.statusBarTextColor) {
        const color = remoteConfig.appConfigs.statusBarTextColor === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
        window.EITRI.connector.invokeMethod(color)
      }

      App.configs = {
        ...App.configs,
        verbose: remoteConfig.verbose ?? false,
        autoTriggerGAEvents: remoteConfig?.autoTriggerGAEvents ?? true,
        appConfigs: {
          ...remoteConfig.appConfigs,
          ...overwrites?.appConfigs,
        },
      }

      console.log('[SHARED] App configurado com sucesso')

      return App.configs

		} catch (error) {
			console.error('Error trying to auto configure VTEX ===>', error)
			throw error
		}
	}
}
