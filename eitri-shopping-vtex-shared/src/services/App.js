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
      App.configs.provider = 'VTEX'
      await Vtex.configure(remoteConfig)
    } catch (error) {
      console.error('[SHARED] Error autoConfigure ', remoteConfig.ecommerceProvider, error)
      throw error
    }

    try {
      if (remoteConfig.clarityId) {
        App.configs.clarityId = remoteConfig.clarityId
        ClarityService.init(remoteConfig.clarityId)
      }
    } catch (error) {
      console.error('[SHARED] Error clarity ', remoteConfig.ecommerceProvider, error)
      throw error
    }

    try {
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

      console.log('[SHARED] *********** App configurado com sucesso ************')

      return App.configs
    } catch (error) {
      console.error('[SHARED] Error App configure ', error)
      throw error
    }

  }
}
