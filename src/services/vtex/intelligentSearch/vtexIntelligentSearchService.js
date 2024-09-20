import VtexCaller from '../_helpers/_vtexCaller'
import VtexCatalogService from '../catalog/vtexCatalogService'

// Deprecated
export default class VtexIntelligentSearchService {
	static async getFacetsByCategoryId(categoryId, categoryLevel = '1') {
		if (!categoryId) {
			return null
		}

		if (categoryId.includes('/')) {
			categoryId = categoryId.split('/')[0]
		}
		const response = await VtexCaller.get(
			`api/io/_v/api/intelligent-search/facets/category-${categoryLevel}/${categoryId}`
		)

		return response.data
	}

	static async getPossibleFacets(facets) {
		const response = await VtexCaller.get(`api/io/_v/api/intelligent-search/facets/${facets}`)

		return response.data
	}

	static async searchProductsByFacetLevelAndCategoryId(categoryId, facetLevel, options = {}) {
		if (!categoryId || !facetLevel) {
			return null
		}
		let queryString = ''

		if (options.page === 0 || options.page) {
			queryString += `?&page=${options.page}`
		}

		const response = await VtexCaller.get(
			`api/io/_v/api/intelligent-search/product_search/${facetLevel}/${categoryId}${queryString}`
		)

		return response.data
	}

	static async getProductsByCategoryId(categoryId) {
		if (!categoryId) {
			return null
		}

		let localCategory = null
		let secondLevelCategory = null
		let thirdLevelCategory = null
		//receber categoryId e se categoryId tiver / pegar a primeira parte
		if (categoryId.includes('/')) {
			localCategory = categoryId.split('/')[0]
			secondLevelCategory = categoryId.split('/')[1]
			thirdLevelCategory = categoryId.split('/')[2]

			//se ela tiver thirdLevelCategory chamar o metodo de cima passando o id e o key
			if (thirdLevelCategory) {
				//ver os facets que ela contem
				const { facets } = await VtexIntelligentSearchService.getFacetsByCategoryId(secondLevelCategory, '2')

				//dentro do secondLevelFacets[] procurar nos values[] que tenha o id referente a subcategory
				const outerFilter = facets.filter(facet => {
					return facet?.values?.some(facetValue => {
						if (facetValue.id === thirdLevelCategory) {
							return facetValue
						}
					})
				})

				const definitiveFilter = outerFilter[0]?.values?.filter(facet => {
					return facet.id === thirdLevelCategory
				})

				//desse cara pegar o id ("3", "12", "15") e key ("category-1", "category-2", "category-3")
				if (!definitiveFilter || definitiveFilter.length === 0) {
					return null
				}

				const { id, key } = definitiveFilter[0]

				console.log('Esses serão id e key', id, key)

				//tendo id e key chamar o metodo de cima passando o id e o key
				const result = await VtexIntelligentSearchService.searchProductsByFacetLevelAndCategoryId(id, key)
				const availableProducts = VtexCatalogService.filterAvailableProductsOnly(result.products)
				return availableProducts
			}

			//e ver os facets que ela contem
			const { facets } = await VtexIntelligentSearchService.getFacetsByCategoryId(categoryId, '1')

			//dentro dos facets[] procurar nos values[] que tenha o id referente a subcategory
			const outerFilter = facets.filter(facet => {
				return facet?.values?.some(facetValue => {
					if (facetValue.id === secondLevelCategory) {
						return facetValue
					}
				})
			})

			const definitiveFilter = outerFilter[0]?.values?.filter(facet => {
				return facet.id === secondLevelCategory
			})

			//desse cara pegar o id ("3", "12", "15") e key ("category-1", "category-2", "category-3")
			if (!definitiveFilter || definitiveFilter.length === 0) {
				return null
			}

			const { id, key } = definitiveFilter[0]

			console.log('Esses serão id e key', id, key)

			//tendo id e key chamar o metodo de cima passando o id e o key
			const result = await VtexIntelligentSearchService.searchProductsByFacetLevelAndCategoryId(id, key)
			const availableProducts = VtexCatalogService.filterAvailableProductsOnly(result.products)
			return availableProducts
		} else {
			const { facets } = await VtexIntelligentSearchService.getFacetsByCategoryId(categoryId, '1')

			const { id, key } = facets[0].values[0]

			const result = await VtexIntelligentSearchService.searchProductsByFacetLevelAndCategoryId(id, key)
			const availableProducts = VtexCatalogService.filterAvailableProductsOnly(result.products)
			return availableProducts
		}
	}
}
