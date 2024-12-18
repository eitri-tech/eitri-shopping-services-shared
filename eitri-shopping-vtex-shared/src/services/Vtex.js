import VtexCatalogService from './vtex/catalog/vtexCatalogService'
import VtexCustomerService from './vtex/customer/vtexCustomerService'
import VtexCheckoutService from './vtex/checkout/vtexCheckoutService'
import VtexCartService from './vtex/cart/VtexCartService'
import VtexCmsService from './vtex/cms/vtexCmsService'
import VtexWishlistService from './vtex/wishlist/vtexWishlistService'
import VtexCaller from './vtex/_helpers/_vtexCaller'
import App from "./App";

export default class Vtex {
	static configs = {
		account: '',
		api: '',
		host: '',
		vtexCmsUrl: '',
		searchOptions: {},
		segments: null
	}

	static configure = async remoteConfig => {
		const { providerInfo, segments, searchOptions, marketingTag, storePreferences } = remoteConfig

		const { account, host, faststore, vtexCmsUrl, bindingId, salesChannel } = providerInfo

		let _host = host
		if (_host && !_host.startsWith('https://')) {
			_host = 'https://' + host
		}

		Vtex.configs = {
			account,
			api: `https://${account}.vtexcommercestable.com.br`,
			host: _host,
			searchOptions,
			segments,
			faststore,
			bindingId,
			vtexCmsUrl,
			salesChannel,
      storePreferences,
			marketingTag: marketingTag ?? 'eitri-shop'
		}

		const session = await Vtex.getSession(segments)
		Vtex.configs.session = session
	}

	static getSession = async (segments) => {
		try {
			if (segments) {
				const _public = {}

				for (const key in segments) {
					if (segments[key] !== null) {
						_public[key] = { value: segments[key] }
					}
				}

				const result = await VtexCaller.post('api/sessions', { public: _public })

				return result.data
			}
			return null
		} catch (e) {
			console.error('Error configuring segments', e)
			return null
		}
	}

  static tryAutoConfigure = async (overwrites) => {
    return await App.tryAutoConfigure(overwrites)
  }

	static catalog = VtexCatalogService
	static checkout = VtexCheckoutService
	static customer = VtexCustomerService
	static cart = VtexCartService
	static cms = VtexCmsService
	static wishlist = VtexWishlistService
}
