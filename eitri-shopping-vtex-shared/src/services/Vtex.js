import Eitri from 'eitri-bifrost'
import VtexCatalogService from './vtex/catalog/vtexCatalogService'
import VtexCustomerService from './vtex/customer/vtexCustomerService'
import VtexCheckoutService from './vtex/checkout/vtexCheckoutService'
import VtexCartService from './vtex/cart/VtexCartService'
import VtexCmsService from './vtex/cms/vtexCmsService'
import VtexWishlistService from './vtex/wishlist/vtexWishlistService'
import VtexStockAlertService from './vtex/stockAlert/vtexStockAlertService'
import VtexCaller from './vtex/_helpers/_vtexCaller'
import VtexStoreService from './vtex/store/vtexStoreService'
import App from './App'
import GAService from './tracking/GAService'
import VtexSearchGraphql from './vtex/search/vtexSearchGraphql'
import { VtexGooglePayServices } from '@/services/vtex/googlePay/vtexGooglePayServices'
import VtexSessionService from '@/services/vtex/session/vtexSessionService'
import RemoteConfig from '@/services/RemoteConfig'

export default class Vtex {
	static configs = {}

	static startVtexParams = async remoteConfig => {
		let _host = remoteConfig?.providerInfo?.host

		if (_host && !_host.startsWith('https://')) {
			_host = _host.replace(/\/+$/, '')

			if (!_host.startsWith('https://')) {
				_host = 'https://' + _host
			}
		}

		const mktTag = await Vtex.getMarketingTag(remoteConfig?.storePreferences)

		Vtex.configs = {
			account: remoteConfig?.providerInfo?.account,
			api: `https://${remoteConfig?.providerInfo?.account}.vtexcommercestable.com.br`,
			host: _host,
			searchOptions: remoteConfig?.searchOptions,
			marketingTag: mktTag,
			faststore: remoteConfig?.providerInfo?.faststore
		}

		await Vtex.startSession()
	}

	static startSession = async () => {
		try {
			let utmParams = (await VtexCustomerService.getUtmParams()) || {}

			const payload = {}

			if (utmParams) {
				payload.public = {}
				const UTM_KEYS = ['utm_source', 'utm_campaign', 'utm_medium', 'utmi_page', 'utmi_part', 'utmi_campaign']
				Object.keys(utmParams).forEach(key => {
					if (!UTM_KEYS.includes(key)) return
					if (!utmParams[key]) return
					payload.public[key] = { value: utmParams[key] }
				})
			}

			await VtexSessionService.createSession(payload)
		} catch (error) {
			console.error('[SHARED] Error ao inicializar session', error)
		}
	}

	static getMarketingTag = async storePreferences => {
		try {
			const device = (await Eitri.device.getInfos()) || {}

			if (device?.platform === 'android' && storePreferences?.androidMarketingTag) {
				return storePreferences?.androidMarketingTag
			}

			if (device?.platform === 'ios' && storePreferences?.iosMarketingTag) {
				return storePreferences?.iosMarketingTag
			}

			return 'eitri-shop'
		} catch (error) {
			console.error('[SHARED] Error trying to set soMktTag from remote config', error)
			return 'eitri-shop'
		}

		Vtex.configs.marketingTag = marketingTag
	}

	static catalog = VtexCatalogService
	static checkout = VtexCheckoutService
	static customer = VtexCustomerService
	static cart = VtexCartService
	static cms = VtexCmsService
	static wishlist = VtexWishlistService
	static stockAlert = VtexStockAlertService
	static store = VtexStoreService
	static searchGraphql = VtexSearchGraphql
	static http = VtexCaller
	static googlePay = VtexGooglePayServices
	static session = VtexSessionService
}
