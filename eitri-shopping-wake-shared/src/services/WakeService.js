import Eitri from 'eitri-bifrost'
import ProductService from "./ProductService"
import GraphqlService from './GraphqlService'
import CategoryService from './CategoryService'
import CartService from './CartService'
import CustomerService from "./CustomerService";
import CheckoutService from "./CheckoutService";
import ClarityService from './tracking/ClarityService'

export default class WakeService {
	static graphQl = GraphqlService
	static product = ProductService
	static category = CategoryService
	static cart = CartService
	static customer = CustomerService
	static checkout = CheckoutService


	static configs = {
		verbose: false,
    gaVerbose: false,
		autoTriggerGAEvents: true,
		clarityId: '',
		provider: 'WAKE',
		account: '',
		tcs_account: '',
		graphqlApi: '',
		host: '',
		cartHost: '',
		searchOptions: {},
		segments: null
	}

	static configure = async remoteConfig => {
		const { providerInfo, marketingTag, ...rest } = remoteConfig

		if (providerInfo.host && !providerInfo.host.startsWith('https://')) {
			providerInfo.host = 'https://' + providerInfo.host
		}
		if (providerInfo.cartHost && !providerInfo.cartHost.startsWith('https://')) {
			providerInfo.cartHost = 'https://' + providerInfo.cartHost
		}
		if (providerInfo.apiHost && !providerInfo.apiHost.startsWith('https://')) {
			providerInfo.apiHost = 'https://' + providerInfo.apiHost
		}

		WakeService.configs = {
      ...WakeService.configs,
			...providerInfo,
			...rest,
			verbose: remoteConfig.verbose ?? false,
			autoTriggerGAEvents: remoteConfig?.autoTriggerGAEvents ?? true,
			graphqlApi: `https://storefront-api.fbits.net/graphql`,
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
			const environment = await Eitri.environment.getName()
			if (remoteConfig.clarityId && environment === 'prod') {
				WakeService.configs.clarityId = remoteConfig.clarityId
				await Eitri.clarity.init(remoteConfig.clarityId)
			}
		} catch (error) {
			console.error('[SHARED] Error clarity ', remoteConfig.clarityId, error)
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

		try {
			if (remoteConfig.clarityId) {
			  WakeService.configs.clarityId = remoteConfig.clarityId
			  ClarityService.init(remoteConfig.clarityId)
			}
		  } catch (error) {
			console.error('[SHARED] Error clarity ', remoteConfig.ecommerceProvider, error)
			throw error
		  }

		console.log(`[SHARED] App WAKE ${WakeService.configs.account} configurado com sucesso`)
		return WakeService.configs
	}

}
