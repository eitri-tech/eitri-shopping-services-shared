import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import { ProductSearchInput } from './types/ProductSearch'
import { productSearchReturn } from './graphqlReturn/ProductSearchReturn'
import { Facets } from './types/Facets'
import { facetsReturn } from './graphqlReturn/FacetsReturn'
import { ProductInput } from './types/ProductInput'
import { productReturn } from './graphqlReturn/ProductReturn'
import { SearchSuggestionInput } from './types/SearchSuggestionInput'
import { searchSuggestionReturn } from './graphqlReturn/SearchSuggestionReturn'
import { ProductRecommendationsInput } from './types/ProductRecommendationsInput'
import { suggestionReturn } from './graphqlReturn/SuggestionReturn'
import { AutoCompleteSearchSuggestionInput } from './types/AutoCompleteSearchSuggestionInput'

export default class VtexSearchGraphql {
	static toGraphQLArgs(obj: any) {
		return Object.entries(obj)
			.map(([key, value]) => {
				if (Array.isArray(value)) {
					// Verifica se são objetos (ex: selectedFacets)
					const arrayStr = value
						.map(item => {
							if (typeof item === 'object') {
								return `{ ${VtexSearchGraphql.toGraphQLArgs(item)} }`
							}
							return typeof item === 'string' ? `"${item}"` : item
						})
						.join(', ')
					return `${key}: [${arrayStr}]`
				}
				if (typeof value === 'object') {
					return `${key}: { ${VtexSearchGraphql.toGraphQLArgs(value)} }`
				}
				return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`
			})
			.join(', ')
	}

	static async productSearch(searchInput: ProductSearchInput, returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(searchInput)

		const body = {
			query: `{ productSearch(${query}) @context(provider: "vtex.search-graphql")  ${returnProperties || productSearchReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.productSearch
	}

	static async facets(searchInput: Facets, returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(searchInput)

		const body = {
			query: `{ facets(${query}) @context(provider: "vtex.search-graphql")  ${returnProperties || facetsReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.facets
	}

	static async product(input: ProductInput, returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(input)

		const body = {
			query: `{ product(${query}) @context(provider: "vtex.search-graphql")  ${returnProperties || productReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.product
	}

	static async searchSuggestions(input: SearchSuggestionInput, returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(input)

		const body = {
			query: `{ searchSuggestions(${query}) @context(provider: "vtex.search-graphql")  ${returnProperties || searchSuggestionReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.searchSuggestions
	}

	static async productRecommendations(input: ProductRecommendationsInput, returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(input)

		const _query = query
			.replace('"id"', 'id')
			.replace('"slug"', 'slug')
			.replace('"reference"', 'reference')
			.replace('"ean"', 'ean')
			.replace('"sku"', 'sku')
			.replace('"buy"', 'buy')
			.replace('"similars"', 'similars')
			.replace('"view"', 'view')
			.replace('"viewAndBought"', 'viewAndBought')
			.replace('"accessories"', 'accessories')
			.replace('"suggestions"', 'suggestions')

		const body = {
			query: `{ productRecommendations(${_query}) @context(provider: "vtex.search-graphql")  ${returnProperties || productReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.productRecommendations
	}

	static async autocomplete(input: AutoFillContactField, returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(input)

		const body = {
			query: `{ autocomplete(${query}) @context(provider: "vtex.search-graphql")  ${returnProperties || suggestionReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.autocomplete
	}

	static async autocompleteSearchSuggestions(
		input: AutoCompleteSearchSuggestionInput,
		returnProperties?: any
	): Promise<any> {
		const { host } = Vtex.configs
		const query = this.toGraphQLArgs(input)

		const body = {
			query: `{ autocompleteSearchSuggestions(${query}) @context(provider: "vtex.search-graphql")  ${returnProperties || searchSuggestionReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.autocompleteSearchSuggestions
	}

	static async topSearches(returnProperties?: any): Promise<any> {
		const { host } = Vtex.configs

		const body = {
			query: `{ topSearches @context(provider: "vtex.search-graphql")  ${returnProperties || searchSuggestionReturn}  }`
		}

		const response = await VtexCaller.post(`api/io/_v/private/graphql/v1`, body, null, host)
		return response?.data?.data?.topSearches
	}
}
