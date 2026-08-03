import Eitri from 'eitri-bifrost'

export default class Widde {
	static config = {
		apiUrl: 'https://api-admin.widde.io/api/story/stories-collection/_',
		productsUrl: 'https://api-admin.widde.io/api/story/products',
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

	static _get = async (href, ecommerceToken) => {
		const res = await Eitri.http.get(href, {
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'ecommerce-token': ecommerceToken,
				'Referer': 'mobile'
			}
		})

		return res.data
	}

	static getStoriesByProductUrl = async (productUrl, options = {}) => {
		const { apiUrl, ecommerceToken, params } = { ...Widde.config, ...options }

		const url = new URL(apiUrl)
		url.searchParams.set('url', productUrl)
		Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

		return Widde._get(url.href, ecommerceToken)
	}

	static getCarouselStories = async (storeUrl, options = {}) => {
		const { apiUrl, ecommerceToken } = { ...Widde.config, ...options }

		const params = {
			loadStories: true,
			generateViewKey: true,
			collectionViewType: 'Carousel',
			webcomponent: 'widde-pro-carousel',
			pageType: 'Home',
			...(options.params || {})
		}

		const url = new URL(apiUrl)
		url.searchParams.set('url', storeUrl)
		Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

		return Widde._get(url.href, ecommerceToken)
	}

	static getProductsByStoryKey = async (storyKey, options = {}) => {
		const { productsUrl, ecommerceToken } = { ...Widde.config, ...options }

		return Widde._get(`${productsUrl}/${storyKey}`, ecommerceToken)
	}
}
