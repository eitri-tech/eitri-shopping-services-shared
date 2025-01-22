import GAService from './GAService'
import App from "../App";

export default class GAVtexInternalService {

  static _autoSendIsOff = () => {
    return !(App.configs.appConfigs?.autoTriggerGAEvents ?? true)
  }

  static _resolveCategory = item => {
    let ids =
      item.productCategoryIds?.split('/').filter(Boolean) || item.categoriesIds[0]?.split('/').filter(Boolean)
    let categories = item.productCategories || item.categories[0]?.split('/').filter(Boolean)
    let result = {}

    ids.forEach((id, index) => {
      const key = index === 0 ? 'item_category' : `item_category${index + 1}`
      result[key] = item.productCategories ? categories[id] : categories[index]
    })

    return result
  }

  static _prepareItems = (items) => {
    return items.map(item => {
      const categories = GAVtexInternalService._resolveCategory(item)

      return {
        item_id: item.id,
        item_name: item.name,
        item_brand: item.additionalInfo?.brandName,
        ...categories,
        price: item.sellingPrice / 100,
        quantity: item.quantity
      }
    })
  }

  static addItemToCart = (addedItems, cart) => {
    try {
      if (GAVtexInternalService._autoSendIsOff()) return
      const _addedItems = Array.isArray(addedItems) ? addedItems : [addedItems]

      const products = _addedItems.map((addedItem) => cart.items.find(i => i.id === addedItem.id)).filter(i => !!i)

      const items = GAVtexInternalService._prepareItems(products)

      if (items.length === 0) return null

      const params = {
        currency: cart?.storePreferencesData?.currencyCode || 'BRL',
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items
      }

      GAService.logEvent('add_to_cart', params)
    } catch (e) {
      console.error('Error on analytics addItemToCart', e)
    }
  }

  static removeItemFromCart = (index, cart) => {
    try {
      if (GAVtexInternalService._autoSendIsOff()) return

      const itemRemoved = cart.items[index]

      const items = GAVtexInternalService._prepareItems([itemRemoved])

      const params = {
        currency: 'BRL',
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items
      }

      GAService.logEvent('remove_from_cart', params)
    } catch (e) {
      console.error('Error on analytics removeItemFromCart', e)
    }
  }

  static addShippingInfo = cart => {
    if (GAVtexInternalService._autoSendIsOff()) return
    try {
      const items = cart.items.map(item => {
        const categories = GAVtexInternalService._resolveCategory(item)

        return {
          item_id: item.id,
          item_name: item.name,
          item_brand: item.additionalInfo?.brandName,
          ...categories,
          price: item.sellingPrice / 100,
          quantity: item.quantity
        }
      })

      let shippingSelected = cart?.shippingData?.logisticsInfo?.map(item => item.selectedSla)
      const uniqueSla = [...new Set(shippingSelected)]

      const totalItemPrice = cart.totalizers.find(item => item.id === 'Items')?.value / 100

      const params = {
        currency: cart?.storePreferencesData?.currencyCode || 'BRL',
        value: totalItemPrice,
        shipping_tier: uniqueSla.join(';'),
        items: items
      }

      GAService.logEvent('add_shipping_info', params)
    } catch (error) {
      console.error('[SHARED] Error on addShippingInfo', error)
    }
  }

  static addPaymentInfo = (cart) => {
    if (GAVtexInternalService._autoSendIsOff()) return
    try {
      const items = cart.items.map(item => {
        const categories = GAVtexInternalService._resolveCategory(item)

        return {
          item_id: item.id,
          item_name: item.name,
          item_brand: item.additionalInfo?.brandName,
          ...categories,
          price: item.sellingPrice / 100,
          quantity: item.quantity
        }
      })

      let paymentSelected = cart?.paymentData?.payments?.map(item => {
        const paymentSystem = cart?.paymentData?.paymentSystems.find(payment => payment.stringId === item.paymentSystem)
        return paymentSystem?.name
      })
      const uniquePayment = [...new Set(paymentSelected)]

      const totalItemPrice = cart.totalizers.find(item => item.id === 'Items')?.value / 100

      const params = {
        currency: cart?.storePreferencesData?.currencyCode || 'BRL',
        value: totalItemPrice,
        payment_type: uniquePayment.join(';'),
        items: items
      }

     GAService.logEvent('add_payment_info', params)
    } catch (error) {
      GAService.logError('Error on begin checkout', error)
    }
  }

  static purchase = (cart, orderId) => {
    try {
      if (GAVtexInternalService._autoSendIsOff()) return

      const items = cart.items.map(item => {
        const categories = GAVtexInternalService._resolveCategory(item)

        return {
          item_id: item.id,
          item_name: item.name,
          item_brand: item.additionalInfo?.brandName,
          ...categories,
          price: item.sellingPrice / 100,
          quantity: item.quantity
        }
      })

      const totalItemPrice = cart.totalizers.find(item => item.id === 'Items')?.value / 100
      const shippingPrice = cart.totalizers.find(item => item.id === 'Shipping')?.value / 100

      const params = {
        currency: 'BRL',
        value: totalItemPrice,
        transaction_id: orderId,
        shipping: shippingPrice,
        items: items
      }

      GAService.logEvent('purchase', params)
    } catch (error) {
      GAService.logError('Error on purchase', error)
    }
  }
}
