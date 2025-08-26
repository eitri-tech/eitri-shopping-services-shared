import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import Eitri from 'eitri-bifrost'
import objectToQueryString from '../_helpers/objectToQueryString'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'
import getSalesChannel from '../_helpers/getSalesChannel'

export default class VtexCatalogService {
	static getSearchOptions = async () => {
		const salesChannel = await getSalesChannel()

		const opt = Vtex.configs.searchOptions || {}

		if (salesChannel) {
			opt['salesChannel'] = salesChannel
		}
		console.log(opt)
		return opt
	}

	static filterAvailableProductsOnly = products => {
		if (!products && products.length === 0) return []
		return products.filter(product =>
			product?.items?.some(item => item.sellers.some(seller => seller.commertialOffer?.AvailableQuantity > 0))
		)
	}

	static async getProductById(productId) {
		const salesChannel = await getSalesChannel()
		let sc = ''
		if (salesChannel) {
			sc = `&sc=${salesChannel}`
		}
		const result = await VtexCaller.get(`api/catalog_system/pub/products/search?fq=productId:${productId}${sc}`)
		return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null
	}

	static async searchProduct(text, options = {}) {
		const defaultOptions = await VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const result = await VtexCaller.get(`api/io/_v/api/intelligent-search/product_search?q=${text}&${queryString}`)
		if (!result || result?.data.length === 0) return []
		return result.data
	}

	static async autoCompleteSuggestions(searchTerm) {
		const result = await VtexCaller.get(
			`api/io/_v/api/intelligent-search/autocomplete_suggestions?query=${searchTerm}`
		)
		return result?.data
	}

	static async getProductsByFacets(facet, options = {}) {
		const defaultOptions = await VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const response = await VtexCaller.get(
			`api/io/_v/api/intelligent-search/product_search/${facet}?${queryString}`,
			{
				params: options
			}
		)
		return response.data
	}

	static async getPossibleFacets(facets, options = {}) {
		const defaultOptions = await VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const response = await VtexCaller.get(`api/io/_v/api/intelligent-search/facets/${facets}?${queryString}`)
		return response.data
	}

	static async getSimilarProducts(productId) {
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
	}

	static async legacySearch(search) {
		const salesChannel = await getSalesChannel()
		let sc = ''
		if (salesChannel) {
			sc = `?sc=${salesChannel}`
		}
		let url = `api/catalog_system/pub/products/search/${search}${sc}`
		const result = await VtexCaller.get(url)
		return result.data
	}

	static async legacyParamsSearch(params) {
		const salesChannel = await getSalesChannel()
		let sc = ''
		if (salesChannel) {
			sc = `?sc=${salesChannel}`
		}
		let url = `api/catalog_system/pub/products/search?${params}${sc}`
		const result = await VtexCaller.get(url)
		return result.data
	}

	static async getWhoSawAlsoSaw(productId) {
		const salesChannel = await getSalesChannel()
		let sc = ''
		if (salesChannel) {
			sc = `?sc=${salesChannel}`
		}
		const result = await VtexCaller.get(
			`api/catalog_system/pub/products/crossselling/whosawalsosaw/${productId}${sc}`
		)
		return result?.data
	}

	static async getCategoryTree(categoryLevels) {
		const result = await VtexCaller.get(`api/catalog_system/pub/category/tree/${categoryLevels}`)
		return result?.data
	}

	static async getProductBySlug(slug) {
		const salesChannel = await getSalesChannel()
		let sc = ''
		if (salesChannel) {
			sc = `?sc=${salesChannel}`
		}
		let url = `api/catalog_system/pub/products/search/${slug}/p${sc}`
		const result = await VtexCaller.get(url)
		return result?.data
	}

	static async topSearches(locale) {
		let url = `api/io/_v/api/intelligent-search/top_searches`
		if (locale) {
			url += `?locale=${locale}`
		}
		const result = await VtexCaller.get(url)
		return result?.data
	}

	static async searchSuggestions(query, locale) {
		let url = `api/io/_v/api/intelligent-search/search_suggestions?query=${query}`
		if (locale) {
			url += `&locale=${locale}`
		}
		const result = await VtexCaller.get(url)
		return result?.data
	}
}
