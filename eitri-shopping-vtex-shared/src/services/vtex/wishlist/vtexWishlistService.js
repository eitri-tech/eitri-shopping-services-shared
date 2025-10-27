import VtexCaller from '../_helpers/_vtexCaller'
import Eitri from 'eitri-bifrost'
import Vtex from '../../Vtex'
import VtexCustomerService from '../customer/vtexCustomerService'
import decodeJwt from '../_helpers/decodeJWT'

export default class VtexWishlistService {
	// TODO: Tratar o nome da lista

	static async listItems(from = 1, to = 50) {
		const tokenData = await VtexCustomerService.getCustomerToken()

		if (!tokenData || !tokenData.token) {
			throw new Error('User not logged')
		}

		const decoded = decodeJwt(tokenData.token)

		if (!decoded || !decoded?.sub) {
			throw new Error('User not found')
		}

		const shopperId = decoded?.sub

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
		const tokenData = await VtexCustomerService.getCustomerToken()

		if (!tokenData || !tokenData.token) {
			throw new Error('User not logged')
		}

		const decoded = decodeJwt(tokenData.token)

		if (!decoded || !decoded?.sub) {
			throw new Error('User not found')
		}

		const shopperId = decoded?.sub


		const body = {
			query: 'mutation RemoveFromList ($shopperId: String!, $id: ID!, $name: String!) { removeFromList(shopperId: $shopperId, id: $id, name: $name) }',
			variables: {
				id: id,
				shopperId: shopperId,
				name: name
			}
		}

		const response = await VtexCaller.post(`_v/private/graphql/v1?locale=pt-BR`, body, {}, Vtex.configs.host)

		Eitri.eventBus.publish({
			channel: "removeFromWishlist",
			data: {
				id,
				response
			}
		});

		return response.data
	}

	static async addItem(productId, title, sku, listName = 'Wishlist') {
		const tokenData = await VtexCustomerService.getCustomerToken()

		if (!tokenData || !tokenData.token) {
			throw new Error('User not logged')
		}

		const decoded = decodeJwt(tokenData.token)

		if (!decoded || !decoded?.sub) {
			throw new Error('User not found')
		}

		const shopperId = decoded?.sub

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

		Eitri.eventBus.publish({
			channel: "addToWishlist",
			data: {
				productId,
				sku,
				response
			}
		});

		return response.data
	}

	static async checkItem(productId) {
		const tokenData = await VtexCustomerService.getCustomerToken()

		if (!tokenData || !tokenData.token) {
			throw new Error('User not logged')
		}

		const decoded = decodeJwt(tokenData.token)

		if (!decoded || !decoded?.sub) {
			throw new Error('User not found')
		}

		const shopperId = decoded?.sub

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
