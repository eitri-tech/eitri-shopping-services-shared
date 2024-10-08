import Eitri from 'eitri-bifrost'
import WakeService from './WakeService'
import StorageService from './StorageService'
import GraphqlService from './GraphqlService'
import { queryAddItem, queryGetCheckout, queryRemoveItem } from 'src/queries/Cart'
// import GAVtexInternalService from '../../tracking/GAVtexInternalService'

export default class CartService {
	static CART_KEY = 'cart_key'

	/**
	* Pega carrinho na memória ou gera um novo se não existir.
	* @returns {SimpleCart} {cartId: string, quantity: number} - O objeto de carrinho simples com id e quantidade de itens
	* @see {@link getCheckout} para objeto completo de carrinho.
	*/
	static async getCurrentOrCreateCart() {
		const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

		let cart
		if (cartId) {
			cart = await CartService.getCartById(cartId)
		} else {
			cart = await CartService.generateNewCart()
		}

		return CartService.parseWakeCartToSimpleCart(cart)
	}

	/**
	* Pega o carrinho de compras atual
	* @param {cartId} - Id do carrinho.
	* @returns {WakeCart} Objeto de carrinho Wake
	* @see {@link getCheckout} para objeto completo de carrinho.
	*/
	static async getCartById(cartId) {
		try {
			console.log('Obtendo dados do carrinho', cartId, WakeService.configs.cartHost)
			const cartCookie = `carrinho-id=${cartId}; path=/`
			const cart = await Eitri.http.get(WakeService.configs.cartHost, {
				headers: {
					Accept: '*/*',
					'Content-Type': 'application/json',
					Cookie: cartCookie
				}
			})
			if (cart?.data?.Id) StorageService.setStorageItem(CartService.CART_KEY, cart?.data?.Id)
			return cart?.data
		} catch (e) {
			console.error('[SHARED] [getCartById] Erro ao obter carrinho', cartId, e)
			throw e
		}
	}

	/**
	* Gera um carrinho de compras
	* @returns {WakeCart} Objeto de carrinho Wake
	* @see {@link getCheckout} para objeto completo de carrinho.
	*/
	static async generateNewCart() {
		try {
			console.log('Gerando novo carrinho', WakeService.configs.cartHost)
			const cart = await Eitri.http.get(WakeService.configs.cartHost)
			if (cart?.data?.Id) StorageService.setStorageItem(CartService.CART_KEY, cart?.data?.Id)
			return cart?.data
		} catch (e) {
			console.error('[SHARED] [generateNewCart] Erro ao gerar novo carrinho', e)
			throw e
		}
	}

	/**
	* Pega carrinho de compras completo
	* @returns {CheckoutObject} Objeto de carrinho completo
	* @see {@link getCheckout} Idem ao getCheckout.
	*/
	static async getFullCart() {
		return getCheckout()
	}

	/**
	* Pega carrinho de compras completo
	* @returns {CheckoutObject} Objeto de carrinho completo
	*/
	static async getCheckout() {
		const cartId = await StorageService.getStorageItem(CartService.CART_KEY)
		try {
			const response = await GraphqlService.query(queryGetCheckout, {
				"checkoutId": cartId
			})
			// GAVtexInternalService.addItemToCart(products, addToCartRes.data, currentPage)
			return response.data
		} catch (e) {
			console.error('[SHARED] [getCheckout] Erro ao pegar itens do carrinho', e)
			throw e
		}
	}

	/**
	* Atualiza o carrinho de compras com novos produtos.
	* @param {Array<{productVariantId: number, quantity: number}>} products - A lista de produtos a serem adicionados ao carrinho.
	* @returns {CheckoutObject} O objeto de checkout atualizado.
	*/
	static async addItems(products) {
		const cartId = await StorageService.getStorageItem(CartService.CART_KEY)
		try {
			const response = await GraphqlService.query(queryAddItem, {
				"checkoutId": cartId,
				"products": products
			})
			// GAVtexInternalService.addItemToCart(products, addToCartRes.data, currentPage)
			return response.data
		} catch (e) {
			console.error('[SHARED] [addItems] Erro ao adicionar itens ao carrinho', e)
			throw e
		}
	}

	/**
	* Remove uma quantidade de produto do carrinho de compras.
	* @param {Array<{productVariantId: number, quantity: number}>} products - A lista de produtos a serem removidos do carrinho.
	* @returns {CheckoutObject} O objeto de checkout atualizado.
	*/
	static async removeItems(products) {
		const cartId = await StorageService.getStorageItem(CartService.CART_KEY)
		try {
			const response = await GraphqlService.query(queryRemoveItem, {
				"checkoutId": cartId,
				"products": products
			})
			// GAVtexInternalService.addItemToCart(products, addToCartRes.data, currentPage)
			return response.data
		} catch (e) {
			console.error('[SHARED] [removeItems] Erro ao remover itens ao carrinho', e)
			throw e
		}
	}

	static async clearCart() {
		await StorageService.removeItem(CartService.CART_KEY)
	}

	static async resolvePostalCode(zipCode, countryCode = 'BRA') {
	}

	static async getClientProfileByEmail(email) {
	}

	static async addClientPreferences(payload) {
	}

	static async addMarketingData(payload) {
	}

	static async listPickPoints(payload) {
	}

	static async clearOrderFormMessages() {
	}

	static async addOfferingsItems(itemIndex, offeringItemId) {
	}

	static async removeOfferingsItems(itemIndex, offeringItemId) {
	}

	static async addOpenTextFieldToCart(value) {
	}

	static async simulateCart(payload, salesChannel) {
	}

	static async updateItem(orderFormId, payload) {
	}

	static async addAttachmentToItem(orderFormId, itemIndex, attachmentId, payload) {
	}

	static async setOrderFormId(orderFormId) {
	}

	static async addGift(selectableGiftId, selectedGifts) {
	}

	static async removeGift(selectableGiftId) {
	}

	/**
	* Converte objeto de carrinho Wake para um padrão simples com Id e quantidade
	* @param {WakeCart} Objeto de carrinho Wake.
	* @returns {cartId: string, quantity: number} O objeto simples de carrinho.
	* @see {@link getCheckout} para objeto completo de carrinho.
	*/
	static parseWakeCartToSimpleCart(wakeCart) {
		const quantity = wakeCart.Produtos.reduce((total, produto) => {
			return total + produto.Quantidade;
		}, 0)

		const simpleCart = {
			cartId: wakeCart.Id,
			quantity
		}
		return simpleCart
	}

}
