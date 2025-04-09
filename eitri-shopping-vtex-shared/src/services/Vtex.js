import VtexCatalogService from './vtex/catalog/vtexCatalogService'
import VtexCustomerService from './vtex/customer/vtexCustomerService'
import VtexCheckoutService from './vtex/checkout/vtexCheckoutService'
import VtexCartService from './vtex/cart/VtexCartService'
import VtexCmsService from './vtex/cms/vtexCmsService'
import VtexWishlistService from './vtex/wishlist/vtexWishlistService'
import VtexCaller from './vtex/_helpers/_vtexCaller'
import VtexStoreService from './vtex/store/vtexStoreService'
import App from './App'
import GAService from './tracking/GAService'

export default class Vtex {
	static configs = {
		account: '',
		api: '',
		host: '',
		vtexCmsUrl: '',
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
		Vtex.configs = {
			account: remoteConfig?.providerInfo?.account,
			api: `https://${remoteConfig?.providerInfo?.account}.vtexcommercestable.com.br`,
			host: _host,
			vtexCmsUrl: remoteConfig?.providerInfo?.vtexCmsUrl,
			searchOptions: remoteConfig?.searchOptions,
			segments: { ...configSegments, ...utmParams },
			marketingTag: remoteConfig?.storePreferences?.marketingTag ?? 'eitri-shop',
			salesChannel: remoteConfig?.storePreferences?.salesChannel,
			faststore: remoteConfig?.providerInfo?.faststore
		}

		const session = await Vtex.buildSession({ ...configSegments, ...utmParams })
		Vtex.configs.session = session
	}

	static buildSession = async (segments, update) => {
		try {
			GAService.sendCampaignDetails(segments)
		} catch (e) {
			console.error('[SHARED] Error send campaign_details', e)
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
					result = await VtexCaller.patch(`api/sessions`, { public: _public })
				} else {
					result = await VtexCaller.post(`api/sessions`, { public: _public })
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
		const session = await Vtex.buildSession(segments, true)
		Vtex.configs.session = session
		Vtex.configs.segments = segments
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
	static store = VtexStoreService
}
