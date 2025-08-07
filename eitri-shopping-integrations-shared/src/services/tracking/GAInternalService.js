import GAService from "./GAService";
import App from "../App";

export default class GAInternalService {
  static _autoSendIsOff = () => {
    return !(App.configs.appConfigs?.autoTriggerGAEvents ?? true);
  };

  static _resolveCategory = (item) => {
    // Implementação genérica para categorias
    let categories = item.categories || [];
    let result = {};

    categories.forEach((category, index) => {
      const key = index === 0 ? "item_category" : `item_category${index + 1}`;
      result[key] = category;
    });

    return result;
  };

  static _prepareItems = (items) => {
    return items.map((item) => {
      const categories = GAInternalService._resolveCategory(item);

      return {
        item_id: item.id || item.sku,
        item_name: item.name || item.title,
        item_brand: item.brand,
        ...categories,
        price: item.price || item.sellingPrice || 0,
        quantity: item.quantity || 1,
      };
    });
  };

  static addItemToCart = (addedItems, cart) => {
    try {
      if (GAInternalService._autoSendIsOff()) return;
      const _addedItems = Array.isArray(addedItems) ? addedItems : [addedItems];

      const items = GAInternalService._prepareItems(_addedItems);

      if (items.length === 0) return null;

      const params = {
        currency: cart?.currency || App.configs?.storePreferences?.currencyCode || "BRL",
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items,
      };

      GAService.logEvent("add_to_cart", params);
    } catch (e) {
      console.error("Error on analytics addItemToCart", e);
    }
  };

  static removeItemFromCart = (removedItems, cart) => {
    try {
      if (GAInternalService._autoSendIsOff()) return;
      const _removedItems = Array.isArray(removedItems) ? removedItems : [removedItems];

      const items = GAInternalService._prepareItems(_removedItems);

      const params = {
        currency: cart?.currency || App.configs?.storePreferences?.currencyCode || "BRL",
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items,
      };

      GAService.logEvent("remove_from_cart", params);
    } catch (e) {
      console.error("Error on analytics removeItemFromCart", e);
    }
  };

  static addShippingInfo = (cart) => {
    if (GAInternalService._autoSendIsOff()) return;
    try {
      const items = GAInternalService._prepareItems(cart.items || []);

      const params = {
        currency: cart?.currency || App.configs?.storePreferences?.currencyCode || "BRL",
        value: cart.totalValue || cart.total || 0,
        shipping_tier: cart.shippingMethod || "standard",
        items: items,
      };

      GAService.logEvent("add_shipping_info", params);
    } catch (error) {
      console.error("[SHARED] Error on addShippingInfo", error);
    }
  };

  static addPaymentInfo = (cart) => {
    if (GAInternalService._autoSendIsOff()) return;
    try {
      const items = GAInternalService._prepareItems(cart.items || []);

      const params = {
        currency: cart?.currency || App.configs?.storePreferences?.currencyCode || "BRL",
        value: cart.totalValue || cart.total || 0,
        payment_type: cart.paymentMethod || "unknown",
        items: items,
      };

      GAService.logEvent("add_payment_info", params);
    } catch (error) {
      GAService.logError("Error on add payment info", error);
    }
  };

  static purchase = (cart, orderId) => {
    try {
      if (GAInternalService._autoSendIsOff()) return;

      const items = GAInternalService._prepareItems(cart.items || []);

      const params = {
        currency: cart?.currency || App.configs?.storePreferences?.currencyCode || "BRL",
        value: cart.totalValue || cart.total || 0,
        transaction_id: orderId,
        shipping: cart.shippingCost || 0,
        items: items,
      };

      GAService.logEvent("purchase", params);
    } catch (error) {
      GAService.logError("Error on purchase", error);
    }
  };

  static viewItem = (item) => {
    try {
      if (GAInternalService._autoSendIsOff()) return;

      const items = GAInternalService._prepareItems([item]);

      const params = {
        currency: App.configs?.storePreferences?.currencyCode || "BRL",
        value: items[0].price,
        items: items,
      };

      GAService.logEvent("view_item", params);
    } catch (error) {
      GAService.logError("Error on view item", error);
    }
  };

  static viewItemList = (items, listName = "Product List") => {
    try {
      if (GAInternalService._autoSendIsOff()) return;

      const preparedItems = GAInternalService._prepareItems(items);

      const params = {
        item_list_name: listName,
        items: preparedItems,
      };

      GAService.logEvent("view_item_list", params);
    } catch (error) {
      GAService.logError("Error on view item list", error);
    }
  };

  static beginCheckout = (cart) => {
    try {
      if (GAInternalService._autoSendIsOff()) return;

      const items = GAInternalService._prepareItems(cart.items || []);

      const params = {
        currency: cart?.currency || App.configs?.storePreferences?.currencyCode || "BRL",
        value: cart.totalValue || cart.total || 0,
        items: items,
      };

      GAService.logEvent("begin_checkout", params);
    } catch (error) {
      GAService.logError("Error on begin checkout", error);
    }
  };
}
