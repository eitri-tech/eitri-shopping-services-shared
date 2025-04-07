import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import Eitri from 'eitri-bifrost'
import objectToQueryString from '../_helpers/objectToQueryString'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'

export default class VtexCatalogService {
	static getSearchOptions = () => {
		return Vtex.configs.searchOptions
	}

	static filterAvailableProductsOnly = products => {
		if (!products && products.length === 0) return []
		return products.filter(product =>
			product?.items?.some(item => item.sellers.some(seller => seller.commertialOffer?.AvailableQuantity > 0))
		)
	}

	static async getProductById(productId) {
		const result = await VtexCaller.get(`api/catalog_system/pub/products/search?fq=productId:${productId}`)
		return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null
	}

	static async searchProduct(text, options = {}) {
		const defaultOptions = VtexCatalogService.getSearchOptions()
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
		const defaultOptions = VtexCatalogService.getSearchOptions()
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
		const defaultOptions = VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const response = await VtexCaller.get(`api/io/_v/api/intelligent-search/facets/${facets}?${queryString}`)
		return response.data
	}

	static async getSimilarProducts(productId) {
		let url = `api/catalog_system/pub/products/crossselling/similars/${productId}`
		const result = await VtexCaller.get(url)

		if (!result || result?.data.length === 0) return []
		const availableProducts = VtexCatalogService.filterAvailableProductsOnly(result.data)

		return availableProducts
	}

	static async legacySearch(search) {
		let url = `api/catalog_system/pub/products/search/${search}`
		const result = await VtexCaller.get(url)
		return result.data
	}

	/*
    @deprecated Esta função será removida
  */
	static async getSearchProducts(search) {
		return await VtexCatalogService.legacySearch(search)
	}

	static async getWhoSawAlsoSaw(productId) {
		const result = await VtexCaller.get(`api/catalog_system/pub/products/crossselling/whosawalsosaw/${productId}`)
		return result?.data
	}

	static async getCategoryTree(categoryLevels) {
		const result = await VtexCaller.get(`api/catalog_system/pub/category/tree/${categoryLevels}`)
		return result?.data
	}

	static async getProductBySlug(slug) {
		let url = `api/catalog_system/pub/products/search/${slug}/p`
		const result = await VtexCaller.get(url)
		return result?.data
	}
}
