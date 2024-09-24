import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import Eitri from 'eitri-bifrost'
import objectToQueryString from '../_helpers/objectToQueryString'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'

export default class VtexCatalogService {
	static getSearchOptions = () => {
		return Vtex.configs.searchOptions
	}

	static async getProductById(productId) {
		const result = await VtexCaller.get(`api/catalog_system/pub/products/search?fq=productId:${productId}`)
		return Array.isArray(result?.data) && result.data.length > 0 ? result.data[0] : null
	}

	static filterAvailableProductsOnly = products => {
		if (!products && products.length === 0) return []
		return products.filter(product =>
			product?.items?.some(item => item.sellers.some(seller => seller.commertialOffer?.AvailableQuantity > 0))
		)
	}

	static async searchProduct(text, options = {}, currentPage = null) {
		const defaultOptions = VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const result = await VtexCaller.get(`api/io/_v/api/intelligent-search/product_search?q=${text}&${queryString}`)
		GAVtexInternalService.viewItemList(result?.data, 'intelligent-search', text, currentPage)
		if (!result || result?.data.length === 0) return []
		return result.data
	}

	static async autoCompleteSuggestions(searchTerm) {
		const result = await VtexCaller.get(
			`api/io/_v/api/intelligent-search/autocomplete_suggestions?query=${searchTerm}`
		)
		return result?.data
	}

	static async getProductsByFacets(facet, options = {}, currentPage) {
		const defaultOptions = VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const response = await VtexCaller.get(
			`api/io/_v/api/intelligent-search/product_search/${facet}?${queryString}`,
			{
				params: options
			}
		)
		GAVtexInternalService.viewItemList(response.data, 'intelligent-search', facet, currentPage)
		return response.data
	}

	static async getPossibleFacets(facets, options = {}) {
		const defaultOptions = VtexCatalogService.getSearchOptions()
		const queryString = objectToQueryString({ ...defaultOptions, ...options })
		const response = await VtexCaller.get(`api/io/_v/api/intelligent-search/facets/${facets}?${queryString}`)
		return response.data
	}

	static async getSimilarProducts(productId, currentPage) {
		let url = `api/catalog_system/pub/products/crossselling/similars/${productId}`
		const result = await VtexCaller.get(url)

		if (!result || result?.data.length === 0) return []
		const availableProducts = VtexCatalogService.filterAvailableProductsOnly(result.data)

		GAVtexInternalService.viewItemList(availableProducts, 'similars', productId, currentPage)

		return availableProducts
	}

	static async getSearchProducts(search, currentPage) {
		let url = `api/catalog_system/pub/products/search/${search}`

		const result = await VtexCaller.get(url)

		GAVtexInternalService.viewItemList(result.data, 'products_search', search, currentPage)
		return result.data
	}

	static async getContent(template, path, blockId) {
		const { bindingId, host } = Vtex.configs
		console.log('Obtendo conteúdo do graphql', bindingId, host)
		const result = await Eitri.http.post(
			`https://${host}/_v/segment/graphql/v1?workspace=master&maxAge=short&appsEtag=remove&domain=store&locale=pt-BR`,
			{
				query: 'query($template: String!, $treePath: String!, $pageContext: PageContextInput!, $blockId: String!) { listContentWithSchema(template: $template, treePath: $treePath, pageContext: $pageContext, blockId: $blockId)  @context(provider: "vtex.pages - graphql@2.116.14")  { content { contentId contentJSON label origin condition { id } } schemaJSON } }',
				variables: {
					template: template,
					treePath: path,
					blockId: blockId,
					pageContext: {
						id: 'store.home',
						type: 'route'
					},
					bindingId: bindingId || ''
				}
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			}
		)
		return result?.data
	}

	static async getWhoSawAlsoSaw(productId, currentPage) {
		const result = await VtexCaller.get(`api/catalog_system/pub/products/crossselling/whosawalsosaw/${productId}`)
		GAVtexInternalService.viewItemList({ products: result?.data }, 'whosawalsosaw', productId, currentPage)
		return result?.data
	}
}
