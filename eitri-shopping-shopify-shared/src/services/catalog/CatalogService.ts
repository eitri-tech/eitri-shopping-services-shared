import ShopifyCaller from '../_helpers/ShopifyCaller'
import { SearchQueryArguments } from '../../models/SearchParams.types'
// @ts-ignore
import {
	SEARCH_QUERY,
	COLLECTION_QUERY,
	PRODUCT_RECOMMENDATIONS,
	PRODUCT
} from '../../graphql/queries/product.queries.gql'
import { CollectionParams } from '../../models/CollectionParams.types'
import RemoteConfig from '../RemoteConfig'
import { CollectionReturn } from '../../models/CollectionReturn.types'
import { Product } from '../../models/Product'

export interface ProductRecommendationsInput {
	intent: string
	productHandle: string
	productId: string
}

export default class CatalogService {
	static async search(params: SearchQueryArguments, personalizedQuery?: string) {
		const _params = {
			...params,
			first: params.first || 12
		}

		const body = {
			query: personalizedQuery || SEARCH_QUERY,
			variables: {
				..._params
			}
		}
		const res = await ShopifyCaller.post(body)
		return res?.data?.data?.search
	}

	static async collection(params: CollectionParams, query: string = COLLECTION_QUERY): Promise<CollectionReturn> {
		const _params = {
			...params,
			first: params.first || 12
		}

		const body = {
			query,
			variables: {
				..._params
			}
		}

		const res = await ShopifyCaller.post(body)
		return res?.data?.data?.collection
	}

	static async predictiveSearch(handle: string) {
		// TODO
	}

	static async productRecommendations(
		params: ProductRecommendationsInput,
		query: string = PRODUCT_RECOMMENDATIONS
	): Promise<Product[]> {
		const _params = {
			...params
		}

		const body = {
			query,
			variables: {
				..._params
			}
		}

		const res = await ShopifyCaller.post(body)

		return res?.data?.data?.productRecommendations
	}

	static async product(params: { handle?: string; id?: string }, query: string = PRODUCT) {
		const body = {
			query,
			variables: {
				...params
			}
		}
		const res = await ShopifyCaller.post(body)
		return res?.data?.data?.product
	}
}
