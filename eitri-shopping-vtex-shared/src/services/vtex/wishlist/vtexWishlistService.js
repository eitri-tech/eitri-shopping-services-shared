import VtexCaller from '../_helpers/_vtexCaller'
import Eitri from 'eitri-bifrost'
import VtexCatalogService from '../catalog/vtexCatalogService'
import Vtex from '../../Vtex'
import VtexCustomerService from '../customer/vtexCustomerService'

export default class VtexWishlistService {
	// TODO: Tratar o nome da lista

	static async listItems(from = 1, to = 20) {
		const user = await VtexCustomerService.retrieveCustomerData()

		if (!user || !user?.email) {
			throw new Error('User not found')
		}

		const shopperId = user.email

		const body = {
			query: 'query ViewLists($shopperId: String!, $from: Int, $to: Int) { viewLists(shopperId: $shopperId, from: $from, to: $to) { data { productId sku title id } name public }}',
			variables: {
				shopperId: shopperId,
				from: from,
				to: to
			}
		}

		const response = await VtexCaller.post(`_v/private/graphql/v1`, body, {}, Vtex.configs.host)
		return response.data
	}

	static async removeItem(id, name = 'Wishlist') {
		const user = await VtexCustomerService.retrieveCustomerData()

		if (!user || !user?.email) {
			throw new Error('User not found')
		}

		const shopperId = user.email

		const body = {
			query: 'mutation RemoveFromList ($shopperId: String!, $id: ID!, $name: String!) { removeFromList(shopperId: $shopperId, id: $id, name: $name) }',
			variables: {
				id: id,
				shopperId: shopperId,
				name: name
			}
		}

		const response = await VtexCaller.post(`_v/private/graphql/v1?locale=pt-BR`, body, {}, Vtex.configs.host)
		return response.data
	}

	static async addItem(productId, title, sku, listName = 'Wishlist') {
		const user = await VtexCustomerService.retrieveCustomerData()

		if (!user || !user?.email) {
			throw new Error('User not found')
		}

		const shopperId = user.email

		const body = {
			query: 'mutation AddToList ($shopperId: String!, $listItem: ListItemInputType!, $name: String!) { addToList(shopperId: $shopperId, listItem: $listItem, name: $name) }',
			variables: {
				listItem: {
					productId: productId,
					title: title,
					sku: sku
				},
				shopperId: shopperId,
				name: listName
			}
		}

		const response = await VtexCaller.post(`_v/private/graphql/v1?locale=pt-BR`, body, {}, Vtex.configs.host)
		return response.data
	}

	static async checkItem(productId) {
		const user = await VtexCustomerService.retrieveCustomerData()

		if (!user || !user?.email) {
			throw new Error('User not found')
		}

		const shopperId = user.email

		const body = {
			query: 'query CheckItem ($shopperId: String!, $productId: String!) { checkList(shopperId: $shopperId, productId: $productId) { inList listNames listIds message }}',
			variables: {
				shopperId: shopperId,
				productId: productId
			}
		}

		const response = await VtexCaller.post(`_v/private/graphql/v1?locale=pt-BR`, body, {}, Vtex.configs.host)
		return response.data
	}
}
