import VtexCatalogService from './vtex/catalog/vtexCatalogService'
import VtexCustomerService from './vtex/customer/vtexCustomerService'
import VtexCheckoutService from './vtex/checkout/vtexCheckoutService'
import VtexCartService from './vtex/cart/VtexCartService'
import VtexIntelligentSearchService from './vtex/intelligentSearch/vtexIntelligentSearchService'
import VtexCmsService from './vtex/cms/vtexCmsService'
import VtexWishlistService from './vtex/wishlist/vtexWishlistService'
import VtexCaller from './vtex/_helpers/_vtexCaller'

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
		const { providerInfo, segments, searchOptions, marketingTag } = remoteConfig

    const { account, host, faststore, vtexCmsUrl } = providerInfo

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
			vtexCmsUrl,
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


	static catalog = VtexCatalogService
	static checkout = VtexCheckoutService
	static customer = VtexCustomerService
	static cart = VtexCartService
	static intelligentSearch = VtexIntelligentSearchService
	static cms = VtexCmsService
	static wishlist = VtexWishlistService
}
