import Eitri from 'eitri-bifrost'
import GraphqlService from './GraphqlService'
import {queryCreateCustomer, queryCustomer, queryCustomerAccessTokenRenew, queryLogin} from "../queries/Customer";
import StorageService from "./StorageService";
import {
  queryCheckoutAddressAssociate, queryCheckoutComplete,
  queryCheckoutCustomerAssociate, queryCheckoutSelectPaymentMethod,
  queryCheckoutSelectShippingQuote, queryPaymentMethods,
  queryShippingQuotes
} from "../queries/Checkout";
import WakeService from "./WakeService";
import CartService from "./CartService";
import CustomerService from "./CustomerService";
import objectToQueryString from "../utils/objectToQueryString";

export default class CheckoutService {

  static async checkoutCustomerAssociate() {
    try {

      const [cart, token] = await Promise.all([
        CartService.getCurrentOrCreateCart(),
        CustomerService.getCustomerToken()
      ])

      if (!token) {
        return null
      }

      const cartId = cart?.cartId

      const response = await GraphqlService.query(queryCheckoutCustomerAssociate, {
        customerAccessToken: token,
        checkoutId: cartId,
      })

      return response
    } catch (e) {
      console.error('[SHARED] [checkoutCustomerAssociate] Erro ao associar usuário no carrinho', e)
      throw e
    }
  }

  static async checkoutAddressAssociate(addressId) {
    try {

      const [cart, token] = await Promise.all([
        CartService.getCurrentOrCreateCart(),
        CustomerService.getCustomerToken()
      ])

      if (!token) {
        return null
      }

      const cartId = cart?.cartId

      const response = await GraphqlService.query(queryCheckoutAddressAssociate, {
        customerAccessToken: token,
        checkoutId: cartId,
        addressId: addressId
      })

      return response
    } catch (e) {
      console.error('[SHARED] [checkoutAddressAssociate] Erro ao associar endereço no carrinho', e)
      throw e
    }
  }

  static async shippingQuotes(useSelectedAddress = true) {
    try {
      const cart = await CartService.getCurrentOrCreateCart()

      const cartId = cart?.cartId

      const response = await GraphqlService.query(queryShippingQuotes, {
        checkoutId: cartId
      })

      return response
    } catch (e) {
      console.error('[SHARED] [shippingQuotes] Erro ao buscar frete', e)
      throw e
    }
  }

  static async checkoutSelectShippingQuote(shippingQuoteId, additionalInformation) {
    try {
      const cart = await CartService.getCurrentOrCreateCart()

      const cartId = cart?.cartId

      const response = await GraphqlService.query(queryCheckoutSelectShippingQuote, {
        checkoutId: cartId,
        shippingQuoteId: shippingQuoteId,
        additionalInformation: additionalInformation
      })

      return response
    } catch (e) {
      console.error('[SHARED] [checkoutSelectShippingQuote] Erro ao selecionar frete', e)
      throw e
    }
  }

  static async paymentMethods() {
    try {
      const cart = await CartService.getCurrentOrCreateCart()

      const cartId = cart?.cartId

      const response = await GraphqlService.query(queryPaymentMethods, {
        checkoutId: cartId
      })

      return response
    } catch (e) {
      console.error('[SHARED] [paymentMethods] Erro ao buscar formas de pagamento', e)
      throw e
    }
  }

  static async checkoutSelectPaymentMethod(paymentMethodId) {
    try {
      const cart = await CartService.getCurrentOrCreateCart()

      const cartId = cart?.cartId

      const response = await GraphqlService.query(queryCheckoutSelectPaymentMethod, {
        checkoutId: cartId,
        paymentMethodId
      })

      return response
    } catch (e) {
      console.error('[SHARED] [checkoutSelectPaymentMethod] Erro ao setar forma de pagamento', e)
      throw e
    }
  }

  static async checkoutComplete(paymentData, comments) {
    try {

      const [cart, token] = await Promise.all([
        CartService.getCurrentOrCreateCart(),
        CustomerService.getCustomerToken()
      ])

      if (!token) {
        return null
      }

      const cartId = cart?.cartId

      const _paymentData = objectToQueryString(paymentData)

      const response = await GraphqlService.query(queryCheckoutComplete, {
        paymentData: _paymentData,
        comments: comments ?? '',
        checkoutId: cartId,
        customerAccessToken: token
      })

      return response
    } catch (e) {
      console.error('[SHARED] [checkoutComplete] Erro ao completar pagamento', e)
      throw e
    }
  }

}
