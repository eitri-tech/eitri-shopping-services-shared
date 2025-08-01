import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import { ProductSearchInput } from './types/ProductSearch'
import { productSearchReturn } from './graphqlReturn/ProductSearchReturn'

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
}
