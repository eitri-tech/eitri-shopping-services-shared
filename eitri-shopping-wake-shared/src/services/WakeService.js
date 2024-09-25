import Eitri from 'eitri-bifrost'
import ProductService from "./ProductService"
import GraphqlService from './GraphqlService'
import CategoryService from './CategoryService'

export default class WakeService {
	static graphQl = GraphqlService
	static product = ProductService
	static category = CategoryService
	

	static configs = {
		provider: 'WAKE',
		account: '',
		tcs_account: '',
		api: '',
		host: '',
		searchOptions: {},
		segments: null
	}

	static configure = async remoteConfig => {
		const { providerInfo, segments, searchOptions, marketingTag } = remoteConfig

		if (providerInfo.host && !providerInfo.host.startsWith('https://')) {
			providerInfo.host = 'https://' + providerInfo.host
		}

		WakeService.configs = {
			...providerInfo,
			api: `https://storefront-api.fbits.net/graphql`,
			searchOptions,
			segments,
			marketingTag: marketingTag ?? 'eitri-shop'
		}
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
			await WakeService.configure(remoteConfig)
		} catch (error) {
			console.error('[SHARED] Error autoConfigure ', remoteConfig.ecommerceProvider, error)
			throw error
		}

		try {
			if (remoteConfig?.appConfigs?.statusBarTextColor) {
				const color = remoteConfig.appConfigs.statusBarTextColor === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
				window.EITRI.connector.invokeMethod(color)
			}
		} catch (error) {
			console.error('[SHARED] Error App configure ', error)
			throw error
		}

		console.log('[SHARED] App WAKE configurado com sucesso')
		return WakeService.configs
	}

}
