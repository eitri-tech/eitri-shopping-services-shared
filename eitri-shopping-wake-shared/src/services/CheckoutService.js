import GraphqlService from './GraphqlService'
import {
	queryAddCheckoutMetadata,
	queryCheckoutAddCoupon,
	queryCheckoutAddressAssociate,
	queryCheckoutClone,
	queryCheckoutComplete,
	queryCheckoutCustomerAssociate,
	queryCheckoutPartnerAssociate,
	queryCheckoutPartnerDisassociate,
	queryCheckoutRemoveCoupon,
	queryCheckoutReset,
	queryCheckoutSelectInstallment,
	queryCheckoutSelectPaymentMethod,
	queryCheckoutSelectShippingQuote,
	queryCheckoutUseCheckingAccount,
	queryPaymentMethods,
	queryRemoveCheckoutMetadata,
	queryShippingQuotes
} from '../queries/Checkout'
import CartService from './CartService'
import CustomerService from './CustomerService'
import objectToQueryString from '../utils/objectToQueryString'
import StorageService from './StorageService'
import GAWakeInternalService from './tracking/GAWakeInternalService'
import StoreService from './StoreService'
import { sendLogError, sendLogOrderAccepted } from '@/services/Datadog'

export default class CheckoutService {
	static PAYMENT_METHODS = null

	static async checkoutCustomerAssociate() {
		const [cartId, token] = await Promise.all([
			StorageService.getStorageItem(CartService.CART_KEY),
			CustomerService.getCustomerToken()
		])

		try {
			if (!cartId || !token) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutCustomerAssociate, {
				customerAccessToken: token,
				checkoutId: cartId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutCustomerAssociate] Erro ao associar usuário no carrinho', e)
			sendLogError(e, 'checkoutCustomerAssociate', {
				cartId
			})
			throw e
		}
	}

	static async checkoutAddressAssociate(addressId) {
		const [cartId, token] = await Promise.all([
			StorageService.getStorageItem(CartService.CART_KEY),
			CustomerService.getCustomerToken()
		])

		try {
			if (!cartId || !token) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutAddressAssociate, {
				customerAccessToken: token,
				checkoutId: cartId,
				addressId: addressId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutAddressAssociate] Erro ao associar endereço no carrinho', e)
			sendLogError(e, 'checkoutAddressAssociate', {
				cartId
			})
			throw e
		}
	}

	/**
	 * Obtém as cotações de frete (shipping quotes) a partir do checkout e dados de entrega.
	 *
	 * @async
	 * @function shippingQuotes
	 * @param {Object} options - Parâmetros opcionais para cálculo de frete.
	 * @param {string} [options.cep] - CEP para cálculo do frete (string simples, ex: "01310930").
	 * @param {number} [options.productVariantId] - ID da variação do produto (caso seja um único produto).
	 * @param {number} [options.quantity] - Quantidade do produto (usado com `productVariantId`).
	 * @param {Array<{productVariantId: number, quantity: number}>} [options.products] - Lista de produtos para cotação.
	 * @param {Array<Object>} [options.kits] - Lista de kits (caso aplicável).
	 *
	 * @returns {Promise<Object|null>} Retorna a resposta da API GraphQL com as opções de frete, ou `null` se não houver `cartId`.
	 *
	 * @throws {Error} Caso ocorra erro na requisição GraphQL.
	 *
	 * @example
	 * const quotes = await ShippingService.shippingQuotes({
	 *   cep: "01310930",
	 *   products: [{ productVariantId: 12345, quantity: 1 }]
	 * })
	 */
	static async shippingQuotes(options = {}) {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

			if (!cartId) {
				console.warn('[SHARED] [shippingQuotes] Nenhum cartId encontrado')
				return null
			}

			const { cep, productVariantId, quantity, products, kits, checkoutId } = options

			// Se houver produtos, kits ou productVariantId, ignora o checkoutId
			const hasDirectQuote = !!(products?.length || kits?.length || productVariantId)

			const variables = {
				checkoutId: hasDirectQuote ? null : checkoutId || cartId,
				cep: cep || null,
				useSelectedAddress: !cep,
				productVariantId: productVariantId || null,
				quantity: quantity || null,
				products: products || null,
				kits: kits || null
			}

			const response = await GraphqlService.query(queryShippingQuotes, variables)

			if (!response) {
				console.warn('[SHARED] [shippingQuotes] Resposta vazia da API')
				return null
			}

			return response
		} catch (e) {
			console.error('[SHARED] [shippingQuotes] Erro ao buscar frete', e)
			throw e
		}
	}

	static async checkoutSelectShippingQuote(shippingQuoteId, additionalInformation) {
		const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

		try {
			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutSelectShippingQuote, {
				checkoutId: cartId,
				shippingQuoteId: shippingQuoteId,
				additionalInformation: additionalInformation
			})

			GAWakeInternalService.addShippingInfo(response.checkoutSelectShippingQuote)

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutSelectShippingQuote] Erro ao selecionar frete', e)
			sendLogError(e, 'checkoutSelectShippingQuote', {
				cartId
			})
			throw e
		}
	}

	static async paymentMethods() {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryPaymentMethods, {
				checkoutId: cartId
			})

			CheckoutService.PAYMENT_METHODS = response.paymentMethods

			return response
		} catch (e) {
			console.error('[SHARED] [paymentMethods] Erro ao buscar formas de pagamento', e)
			throw e
		}
	}

	static async checkoutSelectPaymentMethod(paymentMethodId) {
		const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

		try {
			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutSelectPaymentMethod, {
				checkoutId: cartId,
				paymentMethodId
			})

			GAWakeInternalService.addPaymentInfo(response.checkoutSelectPaymentMethod, CheckoutService.PAYMENT_METHODS)

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutSelectPaymentMethod] Erro ao setar forma de pagamento', e)
			sendLogError(e, 'checkoutSelectPaymentMethod', {
				cartId
			})
			throw e
		}
	}

	static async checkoutComplete(paymentData, comments) {
		const [cartId, token] = await Promise.all([
			StorageService.getStorageItem(CartService.CART_KEY),
			CustomerService.getCustomerToken()
		])

		try {
			if (!cartId || !token) {
				return null
			}

			const _paymentData = objectToQueryString(paymentData)

			const response = await GraphqlService.query(queryCheckoutComplete, {
				paymentData: _paymentData,
				comments: comments ?? '',
				checkoutId: cartId,
				customerAccessToken: token
			})

			sendLogOrderAccepted(response.checkoutComplete)

			GAWakeInternalService.purchase(response.checkoutComplete)

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutComplete] Erro ao completar pagamento', e)
			sendLogError(e, 'checkoutComplete', {
				cartId
			})
			throw e
		}
	}

	static async checkoutSelectInstallment(selectedPaymentMethodId, installmentNumber) {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutSelectInstallment, {
				selectedPaymentMethodId,
				installmentNumber,
				checkoutId: cartId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutSelectInstallment] Erro ao definir parcelas pagamento', e)
			throw e
		}
	}

	static async checkoutAddCoupon(coupon) {
		try {
			const [cartId, token] = await Promise.all([
				StorageService.getStorageItem(CartService.CART_KEY),
				CustomerService.getCustomerToken()
			])

			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutAddCoupon, {
				coupon: coupon,
				checkoutId: cartId,
				customerAccessToken: token ?? ''
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutAddCoupon] Erro ao adicionar cupom', coupon, e)
			throw e
		}
	}

	static async checkoutRemoveCoupon() {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutRemoveCoupon, {
				checkoutId: cartId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutRemoveCoupon] Erro ao remover cupom', e)
			throw e
		}
	}

	static async addCheckoutMetadata(checkoutId, metadata) {
		const eitriMetadata = { key: 'utmSource', value: 'eitri-shop' }
		if (!Array.isArray(metadata) || metadata.length == 0) {
			metadata = [eitriMetadata]
		}

		try {
			const response = await GraphqlService.query(queryAddCheckoutMetadata, {
				checkoutId,
				metadata
			})

			return response
		} catch (e) {
			console.error('[SHARED] [addCheckoutMetadata]', e)
			throw e
		}
	}

	static async checkoutRemoveMetadata(keys) {
		try {
			const checkoutId = await StorageService.getStorageItem(CartService.CART_KEY)

			const response = await GraphqlService.query(queryRemoveCheckoutMetadata, {
				checkoutId,
				keys
			})

			return response
		} catch (e) {
			console.error('[SHARED] [addCheckoutMetadata]', e)
			throw e
		}
	}

	static async checkoutUseCheckingAccount(checkoutId) {
		const token = await CustomerService.getCustomerToken()

		if (!token) {
			return null
		}

		try {
			const response = await GraphqlService.query(queryCheckoutUseCheckingAccount, {
				customerAccessToken: token,
				checkoutId: checkoutId
			})
			return response
		} catch (e) {
			console.error('[SHARED] [checkoutUseCheckingAccount]', e)
			throw e
		}
	}

	static async checkoutReset(checkoutId) {
		try {
			const response = await GraphqlService.query(queryCheckoutReset, {
				checkoutId
			})
			return response
		} catch (e) {
			console.error('[SHARED] [CheckoutReset]', e)
			throw e
		}
	}

	static async checkoutPartnerAssociate() {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)
			const partnerAccessToken = await StoreService.getPartnerAccessToken()

			if (!cartId || !partnerAccessToken) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutPartnerAssociate, {
				pat: partnerAccessToken,
				cId: cartId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutPartnerAssociate] Erro ao associar parceiro no carrinho', e)
			throw e
		}
	}

	static async checkoutPartnerDisassociate() {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutPartnerDisassociate, {
				cId: cartId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [checkoutPartnerDisassociate] Erro ao desassociar parceiro no carrinho', e)
			throw e
		}
	}

	static async checkoutClone() {
		try {
			const cartId = await StorageService.getStorageItem(CartService.CART_KEY)

			if (!cartId) {
				return null
			}

			const response = await GraphqlService.query(queryCheckoutClone, {
				cId: cartId
			})

			return response?.checkoutClone
		} catch (e) {
			console.error('[SHARED] [checkoutPartnerDisassociate] Erro ao desassociar parceiro no carrinho', e)
			throw e
		}
	}
}
