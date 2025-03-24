import Eitri from "eitri-bifrost";
import WakeService from "./WakeService";
import StorageService from "./StorageService";
import GraphqlService from "./GraphqlService";
import {
  queryAddItem,
  queryCreteCheckout,
  queryGetCheckout,
  queryRemoveItem,
} from "../queries/Cart";
import CustomerService from "./CustomerService";
import GAWakeInternalService from "./tracking/GAWakeInternalService";
import GAService from "./tracking/GAService";
import Logger from "./Logger";

export default class CartService {
  static CART_KEY = "cart_key";
  static CACHED_CART = null;

  /**
   * Pega carrinho na memória ou gera um novo se não existir.
   * @param {cartId} - Id do carrinho, se não existir procura no Storage.
   * @returns {SimpleCart} {cartId: string, quantity: number} - O objeto de carrinho simples com id e quantidade de itens
   * @see {@link getCheckout} para objeto completo de carrinho.
   */
  static async getCurrentOrCreateCart() {
    const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

    if (cartId) {
      return CartService.getCheckout();
    } else {
      return CartService.generateNewCart();
    }
  }

  /**
   * Pega carrinho de compras completo
   * @returns {CheckoutObject} Objeto de carrinho completo
   */
  static async getCheckout() {
    const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

    if (cartId) {
      try {
        const token = await CustomerService.getCustomerToken();

        const response = await GraphqlService.query(queryGetCheckout, {
          checkoutId: cartId,
          customerAccessToken: token ?? "",
        });

        CartService.CACHED_CART = response?.data;

        return response.data;
      } catch (e) {
        console.error(
          "[SHARED] [getCheckout] Erro ao obter checkout",
          cartId,
          e,
        );
        throw e;
      }
    }

    return null;
  }

  static getCart = CartService.getCheckout;

  // /**
  // * Pega o carrinho de compras atual
  // * @param {cartId} - Id do carrinho.
  // * @returns {WakeCart} Objeto de carrinho Wake
  // * @see {@link getCheckout} para objeto completo de carrinho.
  // */
  // static async getCartById(cartId) {
  // 	try {
  // 		const cartCookie = `carrinho-id=${cartId}; path=/`
  // 		const cart = await Eitri.http.get(WakeService.configs.cartHost, {
  // 			headers: {
  // 				Accept: '*/*',
  // 				'Content-Type': 'application/json',
  // 				Cookie: cartCookie
  // 			}
  // 		})
  // 		if (cart?.data?.Id) await StorageService.setStorageItem(CartService.CART_KEY, cart.data.Id)
  // 		return cart?.data
  // 	} catch (e) {
  // 		console.error('[SHARED] [getCartById] Erro ao obter carrinho', cartId, e)
  // 		throw e
  // 	}
  // }

  /**
   * Gera um carrinho de compras
   * @returns {WakeCart} Objeto de carrinho Wake
   * @see {@link getCheckout} para objeto completo de carrinho.
   */
  static async generateNewCart() {
    try {
      Logger.log("====> Gerando novo carrinho");

      const response = await GraphqlService.query(queryCreteCheckout);

      Logger.log("====> Novo carrinho gerado", response.data.checkoutId);

      CartService.CACHED_CART = response?.data;

      await StorageService.setStorageItem(
        CartService.CART_KEY,
        response.data.checkoutId,
      );

      return response?.data;
    } catch (e) {
      console.error(
        "[SHARED] [generateNewCart] Erro ao gerar novo carrinho",
        e,
      );
      throw e;
    }
  }

  /**
   * Atualiza o carrinho de compras com novos produtos.
   * @param {Array<{productVariantId: number, quantity: number}>} products - A lista de produtos a serem adicionados ao carrinho.
   * @param {cartId} - Id do carrinho, se não for passado pegará do Storage
   * @returns {CheckoutObject} O objeto de checkout atualizado.
   */
  static async addItems(products) {
    if (
      CartService.CACHED_CART &&
      CartService.CACHED_CART.orders &&
      CartService.CACHED_CART.orders.length > 0
    ) {
      Logger.log("====> [addItems] Cart já possui itens, limpando...");
      await CartService.clearCart();
    }

    let _cartId = await StorageService.getStorageItem(CartService.CART_KEY);
    if (!_cartId) {
      Logger.log("====> [addItems] CartId não encontrado");
      const newCart = await CartService.generateNewCart();
      _cartId = newCart.checkoutId;
    }

    if (!_cartId) {
      throw new Error("Cart not found");
    }

    try {
      Logger.log(
        "====> [addItems] Adicionando itens ao carrinho",
        _cartId,
        products,
      );
      const response = await GraphqlService.query(queryAddItem, {
        checkoutId: _cartId,
        products: products,
      });

      CartService.CACHED_CART = response.data;

      GAWakeInternalService.addItemToCart(products, response.data);

      const allAdded = products.every((addedProduct) =>
        response.data.products.some(
          (productInCart) =>
            productInCart.productVariantId === addedProduct.productVariantId,
        ),
      );
      if (!allAdded) {
        throw new Error("Not all products were added to the cart");
      }

      return response.data;
    } catch (e) {
      console.error(
        "[SHARED] [addItems] Erro ao adicionar itens ao carrinho",
        e,
      );
      throw e;
    }
  }

  /**
   * Remove uma quantidade de produto do carrinho de compras.
   * @param {Array<{productVariantId: number, quantity: number}>} products - A lista de produtos a serem removidos do carrinho.
   * @returns {CheckoutObject} O objeto de checkout atualizado.
   */
  static async removeItems(products) {
    const _cartId = await StorageService.getStorageItem(CartService.CART_KEY);

    try {
      const response = await GraphqlService.query(queryRemoveItem, {
        checkoutId: _cartId,
        products: products,
      });

      GAWakeInternalService.removeItemFromCart(
        products,
        CartService.CACHED_CART,
      );

      CartService.CACHED_CART = response.data;

      return response.data;
    } catch (e) {
      GAService.logError("Error on removeItemFromCart", e);
      throw e;
    }
  }

  static async clearCart() {
    await StorageService.removeItem(CartService.CART_KEY);
    CartService.CACHED_CART = null;
  }

  static async forceCartId(cartId) {
    await StorageService.setStorageItem(CartService.CART_KEY, cartId);
  }
}
