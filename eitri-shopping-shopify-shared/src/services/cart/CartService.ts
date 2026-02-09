import {
	Cart,
	CartResponse,
	CreateCartInput,
	UpdateCartInput,
	CartLineUpdateInput,
	CartBuyerIdentityInput,
	DeliveryAddress,
	DeferredCartResponse,
	DeliveryGroups
} from '../../models/Cart'
import ShopifyCaller from '../_helpers/ShopifyCaller'
// @ts-ignore
import {
	GET_CART,
	CREATE_CART,
	CART_ADD_ITEM,
	CART_LINES_UPDATE,
	CART_LINES_REMOVE,
	CART_GIFT_CARD_CODES_ADD,
	CART_GIFT_CARD_CODES_REMOVE,
	CART_DISCOUNT_CODES_UPDATE,
	CART_BUYER_IDENTITY_UPDATE,
	GET_CART_DELIVERY_OPTIONS
} from '../../graphql/queries/cart.queries.gql'
import StorageService from '../StorageService'
import Logger from '../_helpers/Logger'
import Eitri from 'eitri-bifrost'

export class CartService {
	static SHOPIFY_CART_KEY = 'shopify_cart_key'

	static async assertCartEitriTag(cart: Cart) {}

	static async getCurrentOrCreateCart() {
		const cartId = await StorageService.getStorageItem(CartService.SHOPIFY_CART_KEY)

		if (cartId) {
			return CartService.getCartById(cartId)
		} else {
			return CartService.generateNewCart({})
		}
	}

	static async getCurrentCartIdOrCreate(): Promise<string> {
		const cartId = await StorageService.getStorageItem(CartService.SHOPIFY_CART_KEY)
		if (cartId) {
			return cartId
		}
		const newCart = await CartService.generateNewCart({})
		return newCart.id
	}

	static async getCartById(cartId: string, personalizedQuery?: string): Promise<Cart> {
		const body = {
			query: personalizedQuery || GET_CART,
			variables: {
				cartId
			}
		}

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Carrinho carregado:', cartId)

		const { data } = res.data as { data: CartResponse }

		return data.cart
	}

	static async generateNewCart(params: CreateCartInput = {}) {
		const config = await Eitri.getConfigs()
		const platform = config.applicationData.platform

		const body = {
			query: CREATE_CART,
			variables: {
				input: {
					...params,
					attributes: [
						{
							key: 'origin',
							value: platform === 'android' ? 'eitri_android' : 'eitri_ios'
						}
					]
				}
			}
		}

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Novo carrinho criado')

		const { data } = res.data as { data: { cartCreate: CartResponse } }

		const cart = data.cartCreate.cart

		await CartService.saveCartIdOnStorage(cart.id)

		return cart
	}

	static async addItemToCart(item: UpdateCartInput): Promise<{ cart: Cart; userErrors: any[] }> {
		const cartId = await CartService.getCurrentCartIdOrCreate()

		const body = {
			query: CART_ADD_ITEM,
			variables: {
				cartId,
				lines: [item]
			}
		}

		Logger.log('[CartService] Adicionando item ao carrinho:', item.merchandiseId)

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Item adicionado com sucesso')

		const { data } = res.data

		return data.cartLinesAdd
	}

	static async updateCartLines(lines: CartLineUpdateInput[]): Promise<{ cart: Cart; userErrors: any[] }> {
		const cartId = await CartService.getCurrentCartIdOrCreate()

		const body = {
			query: CART_LINES_UPDATE,
			variables: {
				cartId,
				lines
			}
		}

		Logger.log('[CartService] Atualizando linhas do carrinho:', lines.length, 'item(s)')

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Linhas atualizadas com sucesso')

		const { data } = res.data

		return data.cartLinesUpdate
	}

	static async removeItemFromCart(lineIds: string[]): Promise<{ cart: Cart; userErrors: any[] }> {
		const cartId = await CartService.getCurrentCartIdOrCreate()

		const body = {
			query: CART_LINES_REMOVE,
			variables: {
				cartId,
				lineIds
			}
		}

		Logger.log('[CartService] Removendo itens do carrinho:', lineIds.length, 'item(s)')

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Itens removidos com sucesso')

		const { data } = res.data

		return data.cartLinesRemove
	}

	static async addGiftCardCode(cartId: string, giftCardCodes: string[]) {
		const body = {
			query: CART_GIFT_CARD_CODES_ADD,
			variables: {
				cartId,
				giftCardCodes
			}
		}

		Logger.log('[CartService] Adicionando gift card(s):', giftCardCodes.join(', '))

		const res = await ShopifyCaller.post(body)
		Logger.log('[CartService] Gift card(s) adicionado(s) com sucesso')

		const { data } = res.data as { data: unknown }

		return data
	}

	static async removeGiftCardCode(cartId: string, appliedGiftCardIds: string[]) {
		const body = {
			query: CART_GIFT_CARD_CODES_REMOVE,
			variables: {
				cartId,
				appliedGiftCardIds
			}
		}

		Logger.log('[CartService] Removendo gift card(s):', appliedGiftCardIds.join(', '))

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Gift card(s) removido(s) com sucesso')

		const { data } = res.data as { data: unknown }

		return data
	}

	static async updateDiscountCodes(cartId: string, discountCodes: string[]) {
		const body = {
			query: CART_DISCOUNT_CODES_UPDATE,
			variables: {
				cartId,
				discountCodes
			}
		}

		Logger.log('[CartService] Atualizando cupom(ns):', discountCodes.join(', '))

		const res = await ShopifyCaller.post(body)

		Logger.log('[CartService] Cupom(ns) atualizado(s) com sucesso')

		const { data } = res.data as { data: unknown }

		return data
	}

	static async saveCartIdOnStorage(cartId: string) {
		await StorageService.setStorageItem(CartService.SHOPIFY_CART_KEY, cartId)
	}

	static async updateBuyerIdentity(cartId: string, buyerIdentity: CartBuyerIdentityInput) {
		const body = {
			query: CART_BUYER_IDENTITY_UPDATE,
			variables: {
				cartId,
				buyerIdentity
			}
		}

		Logger.log('[CartService] Atualizando identidade do comprador')

		const res = await ShopifyCaller.post(body)
		Logger.log('[CartService] Identidade do comprador atualizada com sucesso')

		const { data } = res.data as { data: unknown }

		return data
	}

	static async updateDeliveryAddress(cartId: string, address: DeliveryAddress) {
		const buyerIdentity: CartBuyerIdentityInput = {
			deliveryAddressPreferences: [
				{
					deliveryAddress: address
				}
			]
		}

		return CartService.updateBuyerIdentity(cartId, buyerIdentity)
	}

	static async getDeliveryOptionsWithCarrierRates(
		cartId: string,
		onInitialData?: (cart: Partial<Cart>) => void,
		onDeliveryOptions?: (deliveryGroups: DeliveryGroups) => void
	): Promise<void> {
		const body = {
			query: GET_CART_DELIVERY_OPTIONS,
			variables: {
				cartId
			}
		}

		Logger.log('[CartService] Buscando opções de entrega com carrier rates para:', cartId)

		let buffer = ''

		await ShopifyCaller.postStream(body, (chunk: string) => {
			buffer += chunk

			const parts = buffer.split('\r\n\r\n')

			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i]

				const jsonMatch = part.match(/\{[\s\S]*\}/)
				if (jsonMatch) {
					try {
						const parsed: DeferredCartResponse = JSON.parse(jsonMatch[0])

						if (parsed.data?.cart && onInitialData) {
							Logger.log('[CartService] Dados iniciais do carrinho recebidos')
							onInitialData(parsed.data.cart)
						}

						if (parsed.incremental && onDeliveryOptions) {
							for (const increment of parsed.incremental) {
								if (increment.data?.deliveryGroups) {
									Logger.log('[CartService] Opções de entrega calculadas recebidas')
									onDeliveryOptions(increment.data.deliveryGroups)
								}
							}
						}
					} catch (e) {
						Logger.log('[CartService] Erro ao parsear chunk:', e)
					}
				}
			}

			buffer = parts[parts.length - 1]
		})

		Logger.log('[CartService] Stream de opções de entrega finalizado')
	}
}
