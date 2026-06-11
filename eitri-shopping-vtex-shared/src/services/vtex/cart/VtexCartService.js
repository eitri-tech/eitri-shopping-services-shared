import VtexCaller from '../_helpers/_vtexCaller'
import StorageService from '../../StorageService'
import Logger from '../../Logger'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'
import Vtex from '../../Vtex'
import getSalesChannel from '../_helpers/getSalesChannel'
import VtexCustomerService from '@/services/vtex/customer/vtexCustomerService'
import { sendLogError } from '@/services/Datadog'
import Eitri from 'eitri-bifrost'
import EventBusChannels from './../../EventBusChannels'
import objectsAreEqual from '@/services/vtex/_helpers/objectsAreEqual'
import EventBus from '@/services/EventBus'

export default class VtexCartService {
	static VTEX_CART_KEY = 'vtex_cart_key'
	static _CACHED_CART = null

	static async assertMarketingData(cart) {
		try {
			const { segments, marketingTag } = Vtex.configs
			const currentMarketingTags = cart?.marketingData?.marketingTags
				? [...cart?.marketingData?.marketingTags]
				: []

			let _utmParams = (await VtexCustomerService.getUtmParams()) || {}
			const { saveAt, ...rest } = _utmParams
			const utmParams = rest || {}

			const camelCaseKeys = data =>
				Object.fromEntries(
					Object.entries(data).map(([key, value]) => [
						key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
						value
					])
				)

			currentMarketingTags.some(tag => tag === marketingTag) || currentMarketingTags.push(marketingTag)
			const preparedSegments = segments ? camelCaseKeys(segments) : {}
			const preparedUtmParams = utmParams ? camelCaseKeys(utmParams) : {}
			const currentCartMarketingData = cart?.marketingData || {}
			console.log('preparedUtmParams', preparedUtmParams)
			console.log('currentCartMarketingData', currentCartMarketingData)
			const marketingData = {
				utmSource: null,
				utmMedium: null,
				utmCampaign: null,
				utmipage: null,
				utmiPart: null,
				utmiCampaign: null,
				coupon: currentCartMarketingData.coupon,
				...preparedSegments,
				...preparedUtmParams,
				marketingTags: currentMarketingTags
			}

			console.log('marketingData', marketingData)

			const objectsEqual = objectsAreEqual(marketingData, currentCartMarketingData)

			if (objectsEqual) {
				return cart
			}

			Logger.info('===> Atualizando marketing data no carrinho', marketingData)

			const res = await VtexCaller.post(
				`api/checkout/pub/orderForm/${cart.orderFormId}/attachments/marketingData`,
				marketingData
			)

			return res.data
		} catch (e) {
			console.error('Erro ao adicionar marketing data', e)
			return cart
		}
	}

	static async getCartById(orderFormId) {
		try {
			console.log('Obtendo dados do carrinho por id', orderFormId)
			const path = `api/checkout/pub/orderForm/${orderFormId}`
			const response = await VtexCaller.get(path)
			const cart = response.data

			const updatedCart = await VtexCartService.assertMarketingData(cart)

			VtexCartService._CACHED_CART = updatedCart

			return updatedCart
		} catch (e) {
			console.error('Erro ao obter carrinho', orderFormId, e)
			throw e
		}
	}

	static async generateNewCart() {
		try {
			console.log('Gerando novo carrinho')
			const path = 'api/checkout/pub/orderForm'
			const response = await VtexCaller.get(path)

			const cart = response.data

			console.log('Novo carrinho gerado', cart.orderFormId)

			await VtexCartService.saveCartIdOnStorage(cart.orderFormId)

			const updatedCart = await VtexCartService.assertMarketingData(cart)

			VtexCartService._CACHED_CART = updatedCart

			return updatedCart
		} catch (e) {
			console.error('Erro ao gerar novo carrinho', e)
			throw e
		}
	}

	static async saveCartIdOnStorage(orderFormId) {
		await StorageService.setStorageItem(VtexCartService.VTEX_CART_KEY, orderFormId)
	}

	static async getCurrentOrCreateCart() {
		const cartId = await StorageService.getStorageItem(VtexCartService.VTEX_CART_KEY)

		if (cartId) {
			return VtexCartService.getCartById(cartId)
		} else {
			return VtexCartService.generateNewCart()
		}
	}

	static async getCartIfExists() {
		const cartId = await StorageService.getStorageItem(VtexCartService.VTEX_CART_KEY)

		if (!cartId) {
			return null
		}

		return VtexCartService.getCartById(cartId)
	}

	static async getStoredOrderFormId() {
		const cartId = await StorageService.getStorageItem(VtexCartService.VTEX_CART_KEY)
		return cartId
	}

	/**
	 * Adiciona um item ao carrinho ou a um canal de vendas.
	 *
	 * @param {Object} params - Os parâmetros para adicionar o item.
	 * @param {Object} params.item - O item a ser adicionado, pode ser o item do produto ou payload da api da vtex.
	 * @param {string} params.salesChannel - O canal de vendas onde o item será adicionado.
	 * @param {number} params.quantity - A quantidade do item a ser adicionada.
	 * @param {string} params.seller - O ID do vendedor.
	 * @returns {Promise<void>} - Uma promessa que resolve quando o item for adicionado.
	 */
	static async addItem({ id, item, itemId, salesChannel, quantity, seller, sellers }) {
		const _quantity = item?.quantity ?? quantity ?? 1

		let payload = null

		try {
			const itemToSend = {
				id: id ?? itemId ?? item?.itemId ?? item?.id,
				quantity: parseInt(_quantity),
				seller:
					item?.seller ??
					seller ??
					sellers?.find(i => i.sellerDefault)?.sellerId ??
					item?.sellers?.[0]?.sellerId ??
					'1'
			}

			let orderFormId = await VtexCartService.getStoredOrderFormId()
			if (!orderFormId) {
				const cart = await VtexCartService.generateNewCart()
				orderFormId = cart.orderFormId
			}

			payload = {
				orderItems: [itemToSend]
			}

			let url = `api/checkout/pub/orderForm/${orderFormId}/items?allowedOutdatedData=paymentData`

			const _salesChannel = salesChannel ?? (await getSalesChannel())

			if (_salesChannel) {
				url += `&sc=${_salesChannel}`
			}

			const addToCartRes = await VtexCaller.post(url, payload)

			GAVtexInternalService.addItemToCart(itemToSend, addToCartRes.data)

			VtexCartService._CACHED_CART = addToCartRes.data

			EventBus.publish({
				channel: EventBusChannels.ADD_TO_CART,
				broadcast: true,
				data: {
					payload
				}
			})

			return addToCartRes.data
		} catch (e) {
			console.error('[SHARED] [addItems] Erro ao adicionar itens ao carrinho', e)
			sendLogError(e, 'addItem', payload)
			throw e
		}
	}

	/**
	 * Adiciona um ou vários itens ao carrinho.
	 * Compatível com formato antigo e novo.
	 *
	 * @param {Object|Array} input - Item único, array de itens ou objeto estruturado
	 * @param {string} salesChannel - Canal de vendas
	 * @returns {Promise<Object>} - OrderForm atualizado
	 */
	static async addItems(input, salesChannel) {
		let payload = {}
		try {
			if (!input) {
				throw new Error('Nenhum item informado.')
			}

			// Se vier no formato novo { items: [...] }
			let items = input?.items ?? input

			// Garante que sempre será um array
			const normalizedItems = Array.isArray(items) ? items : [items]

			// Normaliza cada item para o formato esperado pela VTEX
			const orderItems = normalizedItems.map((item, index) => {
				const quantity = parseInt(item?.quantity ?? 1)

				return {
					id: item?.id ?? item?.itemId,
					quantity,
					seller:
						item?.seller ??
						item?.sellers?.find(s => s.sellerDefault)?.sellerId ??
						item?.sellers?.[0]?.sellerId ??
						'1',
					index: item?.index ?? index
				}
			})

			let orderFormId = await VtexCartService.getStoredOrderFormId()

			if (!orderFormId) {
				const cart = await VtexCartService.generateNewCart()
				orderFormId = cart.orderFormId
			}

			payload = { orderItems }

			let url = `api/checkout/pub/orderForm/${orderFormId}/items?allowedOutdatedData=paymentData`

			const _salesChannel = salesChannel ?? (await getSalesChannel())

			if (_salesChannel) {
				url += `&sc=${_salesChannel}`
			}

			const addToCartRes = await VtexCaller.post(url, payload)

			GAVtexInternalService.addItemToCart(orderItems, addToCartRes.data)

			VtexCartService._CACHED_CART = addToCartRes.data

			EventBus.publish({
				channel: EventBusChannels.ADD_TO_CART,
				broadcast: true,
				data: { payload }
			})

			return addToCartRes.data
		} catch (e) {
			console.error('[SHARED] [addItems] Erro ao adicionar itens ao carrinho', e)
			sendLogError(e, 'addItems', payload)
			throw e
		}
	}

	// // FUNÇÃO COMPATÍVEL COM VERSÕES ANTIGAS E NOVAS, DEIXEI COMENTADA PARA NÃO QUEBRAR NADA
	// /**
	//  * Adiciona um ou vários itens ao carrinho.
	//  * Compatível com formato antigo e novo.
	//  *
	//  * @param {Object|Array} input - Item único, array de itens ou objeto estruturado
	//  * @param {string} salesChannel - Canal de vendas
	//  * @returns {Promise<Object>} - OrderForm atualizado
	//  */
	// static async addItem(input, salesChannel) {
	// 	let payload = null

	// 	try {
	// 		if (!input) {
	// 			throw new Error('Nenhum item informado.')
	// 		}

	// 		// Se vier no formato novo { items: [...] }
	// 		let items = input?.items ?? input

	// 		// Garante que sempre será um array
	// 		const normalizedItems = Array.isArray(items) ? items : [items]

	// 		// Normaliza cada item para o formato esperado pela VTEX
	// 		const orderItems = normalizedItems.map((item, index) => {
	// 			const quantity = parseInt(item?.quantity ?? 1)

	// 			return {
	// 				id: item?.id ?? item?.itemId,
	// 				quantity,
	// 				seller:
	// 					item?.seller ??
	// 					item?.sellers?.find(s => s.sellerDefault)?.sellerId ??
	// 					item?.sellers?.[0]?.sellerId ??
	// 					'1',
	// 				index: item?.index ?? index
	// 				// SE QUISER DEIXAR ACEITAR O PREÇO DESCOMENTA A LINHA ABAIXO
	// 				// price: item?.price ?? item?.sellers?.[0]?.commertialOffer?.Price * 100 // converte para centavos
	// 			}
	// 		})

	// 		let orderFormId = await VtexCartService.getStoredOrderFormId()

	// 		if (!orderFormId) {
	// 			const cart = await VtexCartService.generateNewCart()
	// 			orderFormId = cart.orderFormId
	// 		}

	// 		payload = { orderItems }

	// 		let url = `api/checkout/pub/orderForm/${orderFormId}/items?allowedOutdatedData=paymentData`

	// 		const _salesChannel = salesChannel ?? (await getSalesChannel())

	// 		if (_salesChannel) {
	// 			url += `&sc=${_salesChannel}`
	// 		}

	// 		const addToCartRes = await VtexCaller.post(url, payload)

	// 		GAVtexInternalService.addItemToCart(orderItems, addToCartRes.data)

	// 		VtexCartService._CACHED_CART = addToCartRes.data

	// 		EventBus.publish({
	// 			channel: EventBusChannels.ADD_TO_CART,
	// 			broadcast: true,
	// 			data: { payload }
	// 		})

	// 		return addToCartRes.data
	// 	} catch (e) {
	// 		console.error('[SHARED] [addItem] Erro ao adicionar itens', e)
	// 		sendLogError(e, 'addItem', payload)
	// 		throw e
	// 	}
	// }

	static async changeItemQuantity(index, newQuantity) {
		try {
			const orderFormId = await VtexCartService.getStoredOrderFormId()
			const payload = {
				orderItems: [
					{
						quantity: newQuantity,
						index: index
					}
				]
			}

			const updateCart = await VtexCaller.post(`api/checkout/pub/orderForm/${orderFormId}/items/update`, payload)
			if (newQuantity === 0) {
				GAVtexInternalService.removeItemFromCart(index, VtexCartService._CACHED_CART)
			}

			VtexCartService._CACHED_CART = updateCart.data

			EventBus.publish({
				channel: EventBusChannels.UPDATE_CART_ITEM,
				broadcast: true,
				data: {
					payload
				}
			})

			return updateCart.data
		} catch (e) {
			console.error('Erro ao modificar a quantidade no carrinho', e)
		}
	}

	static async removeItem(index) {
		return await VtexCartService.changeItemQuantity(index, 0)
	}

	static async removeAllItems() {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/items/removeAll`,
			{},
			{
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Cookie': `CheckoutOrderFormOwnership=; checkout.vtex.com=__ofid=${orderFormId}`
				}
			}
		)

		VtexCartService._CACHED_CART = response.data

		return response.data
	}

	static async removeClientData() {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		Logger.info('Removendo dados do cliente', orderFormId)

		const path = `checkout/changeToAnonymousUser/${orderFormId}`

		return await VtexCaller.get(path)
	}

	static async clearCart() {
		VtexCartService._CACHED_CART = null
		await StorageService.removeItem(VtexCartService.VTEX_CART_KEY)
		await StorageService.removeItem(VtexCustomerService.STORAGE_UTM_PARAMS_KEY)
	}

	static async resolvePostalCode(zipCode, countryCode = 'BRA') {
		const response = await VtexCaller.get(`api/checkout/pub/postal-code/${countryCode}/${zipCode}`)

		return response.data
	}

	static async getClientProfileByEmail(email, ensureComplete = false) {
		const response = await VtexCaller.get(
			`api/checkout/pub/profiles?email=${email}&ensureComplete=${ensureComplete}`
		)
		return response.data
	}

	static async addClientPreferences(payload) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/clientPreferencesData`,
			payload
		)

		return response.data
	}

	static async addMarketingData(payload, append) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		if (!orderFormId) {
			return null
		}

		let finalPayload = payload

		if (append) {
			const cart = await VtexCartService.getCartById(orderFormId)
			const marketingData = cart?.marketingData || {}
			finalPayload = { ...marketingData, ...payload }
		}

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/marketingData`,
			finalPayload
		)

		return response.data
	}

	static async listPickPoints(payload) {
		const { latitude, longitude, postalCode, countryCode } = payload
		let response = null

		if (postalCode && countryCode) {
			response = await VtexCaller.get(
				`api/checkout/pub/pickup-points?&postalCode=${postalCode}&countryCode=${countryCode}`
			)
		} else {
			response = await VtexCaller.get(`api/checkout/pub/pickup-points?geoCoordinates=${longitude};${latitude}`)
		}

		return response.data
	}

	static async clearOrderFormMessages() {
		const orderFormId = await VtexCartService.getStoredOrderFormId()
		await VtexCaller.post(`/api/checkout/pub/orderForm/${orderFormId}/messages/clear`)
	}

	static async addOfferingsItems(itemIndex, offeringItemId) {
		let orderFormId = await VtexCartService.getStoredOrderFormId()

		if (!orderFormId) {
			throw new Error('OrderFormId não encontrado')
		}

		const payload = {
			id: offeringItemId,
			info: null
		}

		try {
			const response = await VtexCaller.post(
				`api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/offerings`,
				payload
			)
			return response.data
		} catch (error) {
			console.error('Erro ao adicionar ofertas ao carrinho:', error)
			throw error
		}
	}

	static async removeOfferingsItems(itemIndex, offeringItemId) {
		try {
			let orderFormId = await VtexCartService.getStoredOrderFormId()
			if (!orderFormId) {
				throw new Error('OrderFormId não encontrado')
			}

			const payload = {
				Id: offeringItemId
			}

			const response = await VtexCaller.post(
				`api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/offerings/${offeringItemId}/remove`,
				payload
			)
			return response.data
		} catch (error) {
			console.error('Erro ao remover ofertas do carrinho:', error)
			throw error
		}
	}

	static async addOpenTextFieldToCart(value) {
		let orderFormId = await VtexCartService.getStoredOrderFormId()
		if (!orderFormId) {
			throw new Error('OrderFormId não encontrado')
		}

		const payload = {
			value
		}

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/openTextField`,
			payload
		)
		return response.data
	}

	static async simulateCart(payload, salesChannel) {
		let path = `api/checkout/pub/orderForms/simulation`
		if (salesChannel) {
			path = `api/checkout/pub/orderForms/simulation?sc=${salesChannel}`
		}
		const response = await VtexCaller.post(path, payload)
		return response.data
	}

	static async updateItem(orderFormId, payload) {
		const updateCart = await VtexCaller.post(`api/checkout/pub/orderForm/${orderFormId}/items/update`, payload)

		return updateCart.data
	}

	static async addAttachmentToItem(itemIndex, attachmentName, payload) {
		let orderFormId = await VtexCartService.getStoredOrderFormId()

		if (!orderFormId) {
			throw new Error('OrderFormId não encontrado')
		}

		const updateCart = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/attachments/${attachmentName}`,
			payload
		)

		return updateCart.data
	}

	static async setOrderFormId(orderFormId) {
		await StorageService.setStorageItem(VtexCartService.VTEX_CART_KEY, orderFormId)
	}

	static async addGift(selectableGiftId, selectedGifts) {
		try {
			let orderFormId = await VtexCartService.getStoredOrderFormId()
			if (!orderFormId) {
				const cart = await VtexCartService.generateNewCart()
				orderFormId = cart.orderFormId
			}

			Logger.info('===> Adicionando gifts no carrinho', orderFormId)

			const payload = {
				id: selectableGiftId,
				selectedGifts
			}

			const addGiftToCartRes = await VtexCaller.post(
				`api/checkout/pub/orderForm/${orderFormId}/selectable-gifts/${selectableGiftId}`,
				payload
			)

			return addGiftToCartRes.data
		} catch (e) {
			console.error('[SHARED] [addGift] Erro ao adicionar gifts carrinho', e)
			throw e
		}
	}

	static async removeGift(selectableGiftId) {
		try {
			let orderFormId = await VtexCartService.getStoredOrderFormId()
			if (!orderFormId) {
				const cart = await VtexCartService.generateNewCart()
				orderFormId = cart.orderFormId
			}

			Logger.info('===> Removendo gifts do carrinho', orderFormId)

			const payload = {
				id: selectableGiftId,
				selectedGifts: []
			}

			const removeGiftToCartRes = await VtexCaller.post(
				`api/checkout/pub/orderForm/${orderFormId}/selectable-gifts/${selectableGiftId}`,
				payload
			)

			return removeGiftToCartRes.data
		} catch (e) {
			console.error('[SHARED] [addGift] Erro ao remover gifts carrinho', e)
			throw e
		}
	}
}
