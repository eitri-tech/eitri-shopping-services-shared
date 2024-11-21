import Eitri from 'eitri-bifrost'
import ProductService from "./ProductService"
import GraphqlService from './GraphqlService'
import CategoryService from './CategoryService'
import CartService from './CartService'
import CustomerService from "./CustomerService";
import CheckoutService from "./CheckoutService";

export default class WakeService {
	static graphQl = GraphqlService
	static product = ProductService
	static category = CategoryService
	static cart = CartService
	static customer = CustomerService
	static checkout = CheckoutService


	static configs = {
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
		const { providerInfo, segments, searchOptions, marketingTag, appConfigs } = remoteConfig

		if (providerInfo.host && !providerInfo.host.startsWith('https://')) {
			providerInfo.host = 'https://' + providerInfo.host
		}
		if (providerInfo.cartHost && !providerInfo.cartHost.startsWith('https://')) {
			providerInfo.cartHost = 'https://' + providerInfo.cartHost
		}

		WakeService.configs = {
			...providerInfo,
			...appConfigs,
			graphqlApi: `https://storefront-api.fbits.net/graphql`,
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

		console.log(`[SHARED] App WAKE ${WakeService.configs.account} configurado com sucesso`)
		return WakeService.configs
	}

}
