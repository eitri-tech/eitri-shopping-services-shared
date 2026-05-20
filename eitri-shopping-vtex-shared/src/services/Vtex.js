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

export default class Vtex {
	static configs = {
		account: '',
		api: '',
		host: '',
		domain: '',
		locale: 'pt-BR',
		vtexCmsUrl: '',
		sendGACampaignAlongSession: true,
		searchOptions: {},
		segments: null,
		session: '',
		marketingTag: 'eitri-shop',
		salesChannel: null,
		faststore: ''
	}

	static configure = async remoteConfig => {
		let _host = remoteConfig?.providerInfo?.host
		if (_host && !_host.startsWith('https://')) {
			_host = 'https://' + remoteConfig?.providerInfo?.host
		}

		let utmParams = (await VtexCustomerService.getUtmParams()) || {}
		const configSegments = remoteConfig?.storePreferences?.segments || {}
		let soMktTag


		try {
			const device = (await Eitri.device.getInfos()) || {}
			if (device?.platform == "android" && remoteConfig?.storePreferences?.androidMarketingTag) {
				soMktTag = remoteConfig?.storePreferences?.androidMarketingTag
			}
			if (device?.platform == "ios" && remoteConfig?.storePreferences?.iosMarketingTag) {
				soMktTag = remoteConfig?.storePreferences?.iosMarketingTag
			}			
		} catch (error) {
			console.error("[SHARED] Error trying to set soMktTag from remote config", error)
		}


		Vtex.configs = {
			account: remoteConfig?.providerInfo?.account,
			api: `https://${remoteConfig?.providerInfo?.account}.vtexcommercestable.com.br`,
			host: _host,
			locale: remoteConfig?.storePreferences?.locale ?? 'pt-BR',
			sendGACampaignAlongSession: remoteConfig?.appConfigs?.sendGACampaignAlongSession ?? true,
			searchOptions: remoteConfig?.searchOptions,
			segments: { ...configSegments, ...utmParams },
			marketingTag: soMktTag ?? remoteConfig?.storePreferences?.marketingTag ?? 'eitri-shop',
			faststore: remoteConfig?.providerInfo?.faststore
		}

		await Vtex.buildSession({ ...configSegments, ...utmParams })

		if (!remoteConfig.skipRefreshToken) {
			Vtex.customer.executeRefreshToken()
		}
	}

	static buildSession = async (segments, update) => {
		if (Vtex.configs.sendGACampaignAlongSession) {
			try {
				GAService.sendCampaignDetails(segments)
				console.log('[SHARED] Campaign segments details sent to GA')
			} catch (e) {
				console.error('[SHARED] Error send campaign_details', e)
			}
		}

		try {
			if (segments) {
				const _public = {}

				for (const key in segments) {
					if (segments[key] !== null) {
						_public[key] = { value: segments[key] }
					}
				}

				let result
				if (update) {
					return await VtexSessionService.updateSession({ public: _public })
				} else {
					return await VtexSessionService.createSession({ public: _public })
				}

				return result?.data
			}
			return null
		} catch (e) {
			console.error('[SHARED] Error configuring segments', e)
			return null
		}
	}

	static tryAutoConfigure = async overwrites => {
		return await App.tryAutoConfigure(overwrites)
	}

	static async updateSegmentSession(utmParams) {
		if (!utmParams) return null

		const configSegments = Vtex.configs?.segments || {}

		const segments = { ...configSegments, ...utmParams }
		await Vtex.buildSession(segments, true)
	}

	static async refreshSegmentSession() {
		let utmParams = (await VtexCustomerService.getUtmParams()) || {}
		Vtex.updateSegmentSession(utmParams)
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
