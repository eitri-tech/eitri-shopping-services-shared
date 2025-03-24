import GraphqlService from "./GraphqlService";
import {
  queryAddCheckoutMetadata,
  queryCheckoutAddCoupon,
  queryCheckoutAddressAssociate,
  queryCheckoutComplete,
  queryCheckoutCustomerAssociate,
  queryCheckoutRemoveCoupon,
  queryCheckoutReset,
  queryCheckoutSelectInstallment,
  queryCheckoutSelectPaymentMethod,
  queryCheckoutSelectShippingQuote,
  queryCheckoutUseCheckingAccount,
  queryPaymentMethods,
  queryShippingQuotes,
} from "../queries/Checkout";
import CartService from "./CartService";
import CustomerService from "./CustomerService";
import objectToQueryString from "../utils/objectToQueryString";
import StorageService from "./StorageService";
import GAWakeInternalService from "./tracking/GAWakeInternalService";

export default class CheckoutService {
  static PAYMENT_METHODS = null;

  static async checkoutCustomerAssociate() {
    try {
      const [cartId, token] = await Promise.all([
        StorageService.getStorageItem(CartService.CART_KEY),
        CustomerService.getCustomerToken(),
      ]);

      if (!cartId || !token) {
        return null;
      }

      const response = await GraphqlService.query(
        queryCheckoutCustomerAssociate,
        {
          customerAccessToken: token,
          checkoutId: cartId,
        },
      );

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutCustomerAssociate] Erro ao associar usuário no carrinho",
        e,
      );
      throw e;
    }
  }

  static async checkoutAddressAssociate(addressId) {
    try {
      const [cartId, token] = await Promise.all([
        StorageService.getStorageItem(CartService.CART_KEY),
        CustomerService.getCustomerToken(),
      ]);

      if (!cartId || !token) {
        return null;
      }

      const response = await GraphqlService.query(
        queryCheckoutAddressAssociate,
        {
          customerAccessToken: token,
          checkoutId: cartId,
          addressId: addressId,
        },
      );

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutAddressAssociate] Erro ao associar endereço no carrinho",
        e,
      );
      throw e;
    }
  }

  static async shippingQuotes(useSelectedAddress = true) {
    try {
      const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(queryShippingQuotes, {
        checkoutId: cartId,
      });

      return response;
    } catch (e) {
      console.error("[SHARED] [shippingQuotes] Erro ao buscar frete", e);
      throw e;
    }
  }

  static async checkoutSelectShippingQuote(
    shippingQuoteId,
    additionalInformation,
  ) {
    try {
      const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(
        queryCheckoutSelectShippingQuote,
        {
          checkoutId: cartId,
          shippingQuoteId: shippingQuoteId,
          additionalInformation: additionalInformation,
        },
      );

      GAWakeInternalService.addShippingInfo(
        response.checkoutSelectShippingQuote,
      );

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutSelectShippingQuote] Erro ao selecionar frete",
        e,
      );
      throw e;
    }
  }

  static async paymentMethods() {
    try {
      const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(queryPaymentMethods, {
        checkoutId: cartId,
      });

      CheckoutService.PAYMENT_METHODS = response.paymentMethods;

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [paymentMethods] Erro ao buscar formas de pagamento",
        e,
      );
      throw e;
    }
  }

  static async checkoutSelectPaymentMethod(paymentMethodId) {
    try {
      const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(
        queryCheckoutSelectPaymentMethod,
        {
          checkoutId: cartId,
          paymentMethodId,
        },
      );

      GAWakeInternalService.addPaymentInfo(
        response.checkoutSelectPaymentMethod,
        CheckoutService.PAYMENT_METHODS,
      );

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutSelectPaymentMethod] Erro ao setar forma de pagamento",
        e,
      );
      throw e;
    }
  }

  static async checkoutComplete(paymentData, comments) {
    try {
      const [cartId, token] = await Promise.all([
        StorageService.getStorageItem(CartService.CART_KEY),
        CustomerService.getCustomerToken(),
      ]);

      if (!cartId || !token) {
        return null;
      }

      const _paymentData = objectToQueryString(paymentData);

      const response = await GraphqlService.query(queryCheckoutComplete, {
        paymentData: _paymentData,
        comments: comments ?? "",
        checkoutId: cartId,
        customerAccessToken: token,
      });

      GAWakeInternalService.purchase(response.checkoutComplete);

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutComplete] Erro ao completar pagamento",
        e,
      );
      throw e;
    }
  }

  static async checkoutSelectInstallment(
    selectedPaymentMethodId,
    installmentNumber,
  ) {
    try {
      const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(
        queryCheckoutSelectInstallment,
        {
          selectedPaymentMethodId,
          installmentNumber,
          checkoutId: cartId,
        },
      );

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutSelectInstallment] Erro ao definir parcelas pagamento",
        e,
      );
      throw e;
    }
  }

  static async checkoutAddCoupon(coupon) {
    try {
      const [cartId, token] = await Promise.all([
        StorageService.getStorageItem(CartService.CART_KEY),
        CustomerService.getCustomerToken(),
      ]);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(queryCheckoutAddCoupon, {
        coupon: coupon,
        checkoutId: cartId,
        customerAccessToken: token ?? "",
      });

      return response;
    } catch (e) {
      console.error(
        "[SHARED] [checkoutAddCoupon] Erro ao adicionar cupom",
        coupon,
        e,
      );
      throw e;
    }
  }

  static async checkoutRemoveCoupon() {
    try {
      const cartId = await StorageService.getStorageItem(CartService.CART_KEY);

      if (!cartId) {
        return null;
      }

      const response = await GraphqlService.query(queryCheckoutRemoveCoupon, {
        checkoutId: cartId,
      });

      return response;
    } catch (e) {
      console.error("[SHARED] [checkoutRemoveCoupon] Erro ao remover cupom", e);
      throw e;
    }
  }

  static async addCheckoutMetadata(checkoutId, metadata) {
    const eitriMetadata = { key: "utmSource", value: "eitri-shop" };
    if (Array.isArray(metadata)) {
      metadata.push(eitriMetadata);
    } else {
      metadata = [eitriMetadata];
    }

    try {
      const response = await GraphqlService.query(queryAddCheckoutMetadata, {
        checkoutId,
        metadata,
      });

      return response;
    } catch (e) {
      console.error("[SHARED] [addCheckoutMetadata]", e);
      throw e;
    }
  }

  static async checkoutUseCheckingAccount(checkoutId) {
    const token = await CustomerService.getCustomerToken();

    if (!token) {
      return null;
    }

    try {
      const response = await GraphqlService.query(
        queryCheckoutUseCheckingAccount,
        { customerAccessToken: token, checkoutId: checkoutId },
      );
      return response;
    } catch (e) {
      console.error("[SHARED] [checkoutUseCheckingAccount]", e);
      throw e;
    }
  }

  static async checkoutReset(checkoutId) {
    try {
      const response = await GraphqlService.query(queryCheckoutReset, {
        checkoutId,
      });
      return response;
    } catch (e) {
      console.error("[SHARED] [CheckoutReset]", e);
      throw e;
    }
  }
}
