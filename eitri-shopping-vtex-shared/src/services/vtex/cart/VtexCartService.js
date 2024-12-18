import VtexCaller from '../_helpers/_vtexCaller'
import StorageService from '../../StorageService'
import Logger from '../../Logger'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'
import Vtex from '../../Vtex'

export default class VtexCartService {
	static VTEX_CART_KEY = 'vtex_cart_key'

	static async assertMarketingData(cart) {
		try {
			const { segments, marketingTag } = Vtex.configs
			const currentMarketingTags = { ...cart?.marketingData }
			const payload = {}

			const keys = [
				{ segmentKey: 'utm_source', tagKey: 'utmSource' },
				{ segmentKey: 'utm_medium', tagKey: 'utmMedium' },
				{ segmentKey: 'utm_campaign', tagKey: 'utmCampaign' },
				{ segmentKey: 'utm_ipage', tagKey: 'utmipage' },
				{ segmentKey: 'utmi_part', tagKey: 'utmiPart' },
				{ segmentKey: 'utmi_campaign', tagKey: 'utmiCampaign' }
			]

			keys.forEach(({ segmentKey, tagKey }) => {
				if (segments?.[segmentKey] || currentMarketingTags?.[tagKey]) {
					if (segments?.[segmentKey] !== currentMarketingTags?.[tagKey]) {
						payload[tagKey] = segments?.[segmentKey]
						delete currentMarketingTags[tagKey]
					}
				}
			})

			if (!currentMarketingTags?.marketingTags?.includes(marketingTag)) {
				payload.marketingTags = [marketingTag]
				delete currentMarketingTags.marketingTags
			}

			if (Object.keys(payload).length > 0) {
				const toUpdate = { ...currentMarketingTags, ...payload }
				Logger.info('===> Atualizando marketing data no carrinho', toUpdate)

				await VtexCaller.post(
					`api/checkout/pub/orderForm/${cart.orderFormId}/attachments/marketingData`,
					toUpdate
				)
			}
		} catch (e) {
			console.error('Erro ao adicionar marketing data', e)
		}
	}

	static async getCartById(orderFormId) {
		try {
			console.log('Obtendo dados do carrinho por id', orderFormId)
			const path = `api/checkout/pub/orderForm/${orderFormId}`
			const response = await VtexCaller.get(path)
			const cart = response.data
			VtexCartService.assertMarketingData(cart)
			return cart
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

			VtexCartService.assertMarketingData(cart)

			console.log('Novo carrinho gerado', cart.orderFormId)

			await VtexCartService.saveCartIdOnStorage(cart.orderFormId)
			return cart
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

		const path = `api/checkout/pub/orderForm/${cartId}`
		const response = await VtexCaller.get(path)
		return response.data
	}

	static async getStoredOrderFormId() {
		const cartId = await StorageService.getStorageItem(VtexCartService.VTEX_CART_KEY)
		return cartId
	}

  /**
   * @deprecated Esta função será removida na próxima versão.
   */
	static async addItems(items, currentPage) {
      await VtexCartService.addItem({ item: items[0], currentPage })
	}

  /**
   * Adiciona um item ao carrinho ou a um canal de vendas.
   *
   * @param {Object} params - Os parâmetros para adicionar o item.
   * @param {Object} params.item - O item a ser adicionado, pode ser o item do produto ou payload da api da vtex.
   * @param {string} params.salesChannel - O canal de vendas onde o item será adicionado.
   * @param {number} params.quantity - A quantidade do item a ser adicionada.
   * @param {string} params.seller - O ID do vendedor.
   * @param {string} params.currentPage - A página atual no contexto da operação.
   * @returns {Promise<void>} - Uma promessa que resolve quando o item for adicionado.
   */
	static async addItem({ id, item, itemId, salesChannel, quantity, seller, sellers, currentPage }) {

    const _quantity = item?.quantity ?? quantity ?? 1

		try {
      const itemToSend = {
        id: id ?? itemId ?? item?.itemId ?? item?.id,
        quantity: parseInt(_quantity),
        seller: item?.seller ?? seller ?? sellers?.find(i => i.sellerDefault)?.sellerId ?? item?.sellers[0].sellerId ?? "1",
      }

			let orderFormId = await VtexCartService.getStoredOrderFormId()
			if (!orderFormId) {
				const cart = await VtexCartService.generateNewCart()
				orderFormId = cart.orderFormId
			}

      const payload = {
        orderItems: [itemToSend]
      }

      let url = `api/checkout/pub/orderForm/${orderFormId}/items?allowedOutdatedData=paymentData`

      const _salesChannel = salesChannel ?? Vtex.configs.salesChannel

      if (_salesChannel) {
        url += `&sc=${_salesChannel}`
      }

      const addToCartRes = await VtexCaller.post(url, payload)

      GAVtexInternalService.addItemToCart([itemToSend], addToCartRes.data, currentPage)

      return addToCartRes.data

		} catch (e) {
			console.error('[SHARED] [addItems] Erro ao adicionar itens ao carrinho', e)
			throw e
		}
	}

	static async changeItemQuantity(index, newQuantity, item, currentPage) {
		try {
			const orderFormId = await VtexCartService.getStoredOrderFormId()
			const payload = {
				orderItems: [
					{
						quantity: `${newQuantity}`,
						index: `${index}`
					}
				]
			}

			const updateCart = await VtexCaller.post(`api/checkout/pub/orderForm/${orderFormId}/items/update`, payload)
			if (newQuantity === 0) {
				GAVtexInternalService.removeItemFromCart(item, currentPage)
			}
			return updateCart.data
		} catch (e) {
			console.error('Erro ao modificar a quantidade no carrinho', e)
		}
	}

	static async removeItem(index, item, currentPage) {
		return await VtexCartService.changeItemQuantity(index, 0, item, currentPage)
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

		return response.data
	}

	static async removeClientData() {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		Logger.info('Removendo dados do cliente', orderFormId)

		const path = `checkout/changeToAnonymousUser/${orderFormId}`

		return await VtexCaller.get(path)
	}

	static async clearCart() {
		await StorageService.removeItem(VtexCartService.VTEX_CART_KEY)
	}

	static async resolvePostalCode(zipCode, countryCode = 'BRA') {
		const response = await VtexCaller.get(`api/checkout/pub/postal-code/${countryCode}/${zipCode}`)

		return response.data
	}

	static async getClientProfileByEmail(email) {
		const response = await VtexCaller.get(`api/checkout/pub/profiles?email=${email}`)
		return response.data
	}

	static async addClientPreferences(payload) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/clientPreferencesData`,
			{
				locale: payload?.locale,
				optinNewsLetter: payload?.optinNewsLetter
			}
		)

		return response.data
	}

	static async addMarketingData(payload) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/marketingData`,
			payload
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
			response = await VtexCaller.get(
				`api/checkout/pub/pickup-points?geoCoordinates=${latitude}&geoCoordinates=${longitude}`
			)
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

	static async addAttachmentToItem(orderFormId, itemIndex, attachmentId, payload) {
		const updateCart = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/items/${itemIndex}/attachments/${attachmentId}`,
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
