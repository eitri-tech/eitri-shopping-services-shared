import Eitri from 'eitri-bifrost'
import ProductService from './ProductService'
import GraphqlService from './GraphqlService'
import CategoryService from './CategoryService'
import CartService from './CartService'
import CustomerService from './CustomerService'
import CheckoutService from './CheckoutService'
import ClarityService from './tracking/ClarityService'
import StoreService from './StoreService'

export default class WakeService {
	static graphQl = GraphqlService
	static product = ProductService
	static category = CategoryService
	static cart = CartService
	static customer = CustomerService
	static store = StoreService
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

	static configure = remoteConfig => {
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
			console.log('[SHARED] ********* Buscando remote config *******')
			const _remoteConfig = await Eitri.environment.getRemoteConfigs()
			console.log('[SHARED] ********* Remote config encontrado *******')
			remoteConfig = { ..._remoteConfig, ...overwrites }
		} catch (error) {
			console.log('[SHARED] Error getRemoteConfigs', error)
			throw error
		}

		try {
			console.log('[SHARED] ********* Configurando variáveis globais *******')
			WakeService.configure(remoteConfig)
		} catch (error) {
			console.log('[SHARED] Error autoConfigure ', remoteConfig.ecommerceProvider, error)
			throw error
		}

		try {
			console.log('[SHARED] ********* Verificando Clarity *******')
			const environment = await Eitri.environment.getName()
			if (remoteConfig.appConfigs?.clarityId && environment === 'prod') {
				ClarityService.init(remoteConfig.appConfigs.clarityId)
			} else {
				console.log('[SHARED] ********* Clarity Id não encontrado ou não é prod *******')
			}
		} catch (error) {
			console.log('[SHARED] Error clarity ', remoteConfig.clarityId, error)
		}

		try {
			console.log('[SHARED] ********* Configurando status bar text color *******')

			if (remoteConfig?.appConfigs?.statusBarTextColor) {
				const color =
					remoteConfig.appConfigs.statusBarTextColor === 'white'
						? 'setStatusBarTextWhite'
						: 'setStatusBarTextBlack'
				window.EITRI.connector.invokeMethod(color)
			}
		} catch (error) {
			console.log('[SHARED] Error App configure ', error)
		}

		console.log(`[SHARED] App WAKE ${WakeService.configs.account} configurado com sucesso`)
		return WakeService.configs
	}
}
