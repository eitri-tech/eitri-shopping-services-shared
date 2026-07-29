import Eitri from 'eitri-bifrost'

export default class Widde {
	static config = {
		apiUrl: 'https://api-admin.widde.io/api/story/stories-collection/_',
		ecommerceToken: 'BR',
		params: {
			loadStories: true,
			generateViewKey: true,
			collectionViewType: 'Story',
			webcomponent: 'widde-floating-block',
			pageType: 'Product'
		}
	}

	static setConfig(options) {
		Widde.config = { ...Widde.config, ...options }
	}

	static getConfig() {
		return Widde.config
	}

	static getStoriesByProductUrl = async (productUrl, options = {}) => {
		const { apiUrl, ecommerceToken, params } = { ...Widde.config, ...options }

		const url = new URL(apiUrl)
		url.searchParams.set('url', productUrl)
		Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

		return Eitri.http.get(url.href, {
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'ecommerce-token': ecommerceToken,
				'Referer': 'mobile'
			}
		})
	}
}
