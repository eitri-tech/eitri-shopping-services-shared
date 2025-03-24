import GAService from "./GAService";

export default class GAWakeInternalService {
  static addItemToCart = (addedItems, cart) => {
    try {
      let items = addedItems
        .map((addedItem) => {
          const item = cart.products.find(
            (i) => i.productVariantId === addedItem.productVariantId,
          );

          if (!item) {
            return null;
          }

          return {
            item_id: item.productVariantId,
            item_name: item.name,
            price: item.price,
            quantity: addedItem.quantity,
          };
        })
        .filter((item) => !!item);

      const params = {
        currency: "BRL",
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items,
      };

      GAService.logEvent("add_to_cart", params);
    } catch (e) {
      GAService.logError("Error on addItemToCart", e);
    }
  };

  static removeItemFromCart = (itemsRemoved, cart) => {
    try {
      let items = itemsRemoved
        .map((removedItem) => {
          const item = cart.products.find(
            (i) => i.productVariantId === removedItem.productVariantId,
          );

          if (!item) {
            return null;
          }

          return {
            item_id: item.productVariantId,
            item_name: item.name,
            price: item.price,
            quantity: removedItem.quantity,
          };
        })
        .filter((item) => !!item);

      const params = {
        currency: "BRL",
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items,
      };

      GAService.logEvent("remove_from_cart", params);
    } catch (e) {
      GAService.logError("Error on removeItemToCart", e);
    }
  };

  static beginCheckout = (cart, currentPage = null) => {
    try {
      const items = cart.items.map((addedItem, index) => {
        const item = cart.items.find((i) => i.id === addedItem.id);
        if (!item) {
          return null;
        }

        return {
          item_id: item.id,
          item_name: item.skuName,
          item_brand: item.additionalInfo?.brandName,
          price: item.price / 100,
          quantity: item.quantity,
        };
      });

      const params = {
        currency: cart?.storePreferencesData?.currencyCode || "BRL",
        value: cart.value / 100,
        coupon: cart?.marketingData?.coupon || "",
        items: items,
      };
      GAService.logEvent("begin_checkout", currentPage, params);
    } catch (e) {
      GAService.logError("Error on begin checkout", e, currentPage);
    }
  };

  static addShippingInfo = (cart) => {
    try {
      const items = cart.products.map((product) => {
        return {
          item_id: product.productVariantId,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        };
      });

      const params = {
        currency: "BRL",
        value: cart?.total,
        shipping_tier: cart?.selectedShipping?.name,
        items: items,
      };

      GAService.logEvent("add_shipping_info", params);
    } catch (error) {
      GAService.logError("Error on add shipping info", error);
    }
  };

  static addPaymentInfo = (cart, paymentMethods) => {
    try {
      const items = cart.products.map((product) => {
        return {
          item_id: product.productVariantId,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        };
      });

      const selectedPaymentMethod = paymentMethods?.find(
        (method) => method.id === cart?.selectedPaymentMethod?.paymentMethodId,
      );

      const params = {
        currency: "BRL",
        value: cart?.total,
        payment_type: selectedPaymentMethod?.name ?? "",
        items: items,
      };

      GAService.logEvent("add_payment_info", params);
    } catch (error) {
      GAService.logError("Error on begin checkout", error, currentPage);
    }
  };

  static purchase = (cart) => {
    try {
      const items = cart.products.map((product) => {
        return {
          item_id: product.productVariantId,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity,
        };
      });

      const params = {
        currency: "BRL",
        value: cart?.total,
        transaction_id: cart?.orders?.[0]?.orderId,
        items: items,
      };

      GAService.logEvent("purchase", params);
    } catch (error) {
      GAService.logError("Error on purchase", error);
    }
  };
}
