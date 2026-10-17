import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import Eitri from 'eitri-bifrost'
import objectToQueryString from '../_helpers/objectToQueryString'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'
import getSalesChannel from '../_helpers/getSalesChannel'
import { sendLogError } from '@/services/Datadog'

export default class VtexCatalogService {
	static getSearchOptions = async () => {
		const salesChannel = await getSalesChannel()
		const opt = Vtex.configs.searchOptions || {}

		if (salesChannel) {
			opt['salesChannel'] = salesChannel
		}
		return opt
	}

	static filterAvailableProductsOnly = products => {
		if (!products && products.length === 0) return []
		return products.filter(product =>
			product?.items?.some(item => item.sellers.some(seller => seller.commertialOffer?.AvailableQuantity > 0))
		)
	}

	static async getProductById(productId) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `&sc=${salesChannel}`
			}
			const result = await VtexCaller.get(`api/catalog_system/pub/products/search?fq=productId:${productId}${sc}`)
			return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null
		} catch (e) {
			sendLogError(e, 'getProductById', { productId: productId ?? null })
			throw e
		}
	}

	static async getSkuById(skuId) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `&sc=${salesChannel}`
			}
			const result = await VtexCaller.get(`api/catalog_system/pub/products/search?fq=skuId:${skuId}${sc}`)
			return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null
		} catch (e) {
			sendLogError(e, 'getSkuById', { skuId: skuId ?? null })
			throw e
		}
	}

	static async searchProduct(text, options = {}) {
		try {
			const defaultOptions = await VtexCatalogService.getSearchOptions()
			const queryString = objectToQueryString({ ...defaultOptions, ...options })
			const result = await VtexCaller.get(`api/io/_v/api/intelligent-search/product_search?q=${text}&${queryString}`)
			if (!result || result?.data.length === 0) return []
			return result.data
		} catch (e) {
			sendLogError(e, 'searchProduct', { text: text ?? null })
			throw e
		}
	}

	static async autoCompleteSuggestions(searchTerm) {
		try {
			const result = await VtexCaller.get(
				`api/io/_v/api/intelligent-search/autocomplete_suggestions?query=${searchTerm}`
			)
			return result?.data
		} catch (e) {
			sendLogError(e, 'autoCompleteSuggestions', { searchTerm: searchTerm ?? null })
			throw e
		}
	}

	static async getProductsByFacets(facet, options = {}) {
		try {
			const defaultOptions = await VtexCatalogService.getSearchOptions()
			const queryString = objectToQueryString({ ...defaultOptions, ...options })
			const response = await VtexCaller.get(
				`api/io/_v/api/intelligent-search/product_search/${facet}?${queryString}`,
				{
					params: options
				}
			)
			return response.data
		} catch (e) {
			sendLogError(e, 'getProductsByFacets', { facet: facet ?? null })
			throw e
		}
	}

	static async getPossibleFacets(facets, options = {}) {
		try {
			const defaultOptions = await VtexCatalogService.getSearchOptions()
			const queryString = objectToQueryString({ ...defaultOptions, ...options })
			const response = await VtexCaller.get(`api/io/_v/api/intelligent-search/facets/${facets}?${queryString}`)
			return response.data
		} catch (e) {
			sendLogError(e, 'getPossibleFacets', { facets: facets ?? null })
			throw e
		}
	}

	static async getSimilarProducts(productId) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `?sc=${salesChannel}`
			}
			let url = `api/catalog_system/pub/products/crossselling/similars/${productId}${sc}`
			const result = await VtexCaller.get(url)

			if (!result || result?.data.length === 0) return []
			const availableProducts = VtexCatalogService.filterAvailableProductsOnly(result.data)

			return availableProducts
		} catch (e) {
			sendLogError(e, 'getSimilarProducts', { productId: productId ?? null })
			throw e
		}
	}

	static async legacySearch(search) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `?sc=${salesChannel}`
			}
			let url = `api/catalog_system/pub/products/search/${search}${sc}`
			const result = await VtexCaller.get(url)
			return result.data
		} catch (e) {
			sendLogError(e, 'legacySearch', { search: search ?? null })
			throw e
		}
	}

	static async legacyParamsSearch(params) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `&sc=${salesChannel}`
			}
			let url = `api/catalog_system/pub/products/search?${params}${sc}`
			const result = await VtexCaller.get(url)
			return result.data
		} catch (e) {
			sendLogError(e, 'legacyParamsSearch')
			throw e
		}
	}

	static async getWhoSawAlsoSaw(productId) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `?sc=${salesChannel}`
			}
			const result = await VtexCaller.get(
				`api/catalog_system/pub/products/crossselling/whosawalsosaw/${productId}${sc}`
			)
			return result?.data
		} catch (e) {
			sendLogError(e, 'getWhoSawAlsoSaw', { productId: productId ?? null })
			throw e
		}
	}

	static async getCategoryTree(categoryLevels) {
		try {
			const result = await VtexCaller.get(`api/catalog_system/pub/category/tree/${categoryLevels}`)
			return result?.data
		} catch (e) {
			sendLogError(e, 'getCategoryTree', { categoryLevels: categoryLevels ?? null })
			throw e
		}
	}

	static async getProductBySlug(slug) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `?sc=${salesChannel}`
			}
			let url = `api/catalog_system/pub/products/search/${slug}/p${sc}`
			const result = await VtexCaller.get(url)
			return result?.data
		} catch (e) {
			sendLogError(e, 'getProductBySlug', { slug: slug ?? null })
			throw e
		}
	}

	static async topSearches(locale) {
		try {
			let url = `api/io/_v/api/intelligent-search/top_searches`
			if (locale) {
				url += `?locale=${locale}`
			}
			const result = await VtexCaller.get(url)
			return result?.data
		} catch (e) {
			sendLogError(e, 'topSearches', { locale: locale ?? null })
			throw e
		}
	}

	static async searchSuggestions(query, locale) {
		try {
			let url = `api/io/_v/api/intelligent-search/search_suggestions?query=${query}`
			if (locale) {
				url += `&locale=${locale}`
			}
			const result = await VtexCaller.get(url)
			return result?.data
		} catch (e) {
			sendLogError(e, 'searchSuggestions', { query: query ?? null, locale: locale ?? null })
			throw e
		}
	}

	static async showTogether(productId) {
		try {
			const salesChannel = await getSalesChannel()
			let sc = ''
			if (salesChannel) {
				sc = `?sc=${salesChannel}`
			}
			let url = `/api/catalog_system/pub/products/crossselling/showtogether/${productId}${sc}`
			const result = await VtexCaller.get(url)
			return result?.data
		} catch (e) {
			sendLogError(e, 'showTogether', { productId: productId ?? null })
			throw e
		}
	}
}
