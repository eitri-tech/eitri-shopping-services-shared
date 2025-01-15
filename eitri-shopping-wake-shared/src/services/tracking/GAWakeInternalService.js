import GAService from './GAService'

export default class GAWakeInternalService {
	static addItemToCart = (addedItems, cart) => {
		try {
			let items = addedItems.map((addedItem) => {
				const item = cart.products.find(i => i.productVariantId === addedItem.productVariantId)

        if (!item) {
					return null
				}

				return {
					item_id: item.productVariantId,
					item_name: item.name,
					price: item.price,
					quantity: addedItem.quantity
				}
			}).filter(item => !!item)

			const params = {
				currency: 'BRL',
				value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
				items: items
			}

			GAService.logEvent('add_to_cart', params)
		} catch (e) {
			GAService.logError('Error on addItemToCart', e)
		}
	}

	static removeItemFromCart = (itemsRemoved, cart) => {
		try {

      let items = itemsRemoved.map((removedItem) => {
        const item = cart.products.find(i => i.productVariantId === removedItem.productVariantId)

        if (!item) {
          return null
        }

        return {
          item_id: item.productVariantId,
          item_name: item.name,
          price: item.price,
          quantity: removedItem.quantity
        }
      }).filter(item => !!item)

      const params = {
        currency: 'BRL',
        value: items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
        items: items
      }

			GAService.logEvent('remove_from_cart', params)
		} catch (e) {
			GAService.logError('Error on removeItemToCart', e)
		}
	}

	static beginCheckout = (cart, currentPage = null) => {
		try {
			const items = cart.items.map((addedItem, index) => {
				const item = cart.items.find(i => i.id === addedItem.id)
				if (!item) {
					return null
				}

				return {
					item_id: item.id,
					item_name: item.skuName,
					item_brand: item.additionalInfo?.brandName,
					price: item.price / 100,
					quantity: item.quantity
				}
			})

			const params = {
				currency: cart?.storePreferencesData?.currencyCode || 'BRL',
				value: cart.value / 100,
				coupon: cart?.marketingData?.coupon || '',
				items: items
			}
			GAService.logEvent('begin_checkout', currentPage, params)
		} catch (e) {
			GAService.logError('Error on begin checkout', e, currentPage)
		}
	}

	static addShippingInfo = (cart) => {
		try {
			const items = cart.products.map(product => {
				return {
					item_id: product.productVariantId,
					item_name: product.name,
					price: product.price,
					quantity: product.quantity
				}
			})

			const params = {
				currency: 'BRL',
				value: cart?.total,
        shipping_tier: cart?.selectedShipping?.name,
        items: items
			}

			GAService.logEvent('add_shipping_info', params)
		} catch (error) {
			GAService.logError('Error on add shipping info', error)
		}
	}

	static addPaymentInfo = (cart, currentPage = null) => {
		try {
			const items = cart.items.map((addedItem, index) => {
				const item = cart.items.find(i => i.id === addedItem.id)
				if (!item) {
					return null
				}

				return {
					item_id: item.id,
					item_name: item.skuName,
					item_brand: item.additionalInfo?.brandName,
					price: item.price / 100,
					quantity: item.quantity
				}
			})

			let shippingSelected = cart?.shipping?.options.find(item => item.isCurrent === true)

			const params = {
				currency: cart?.storePreferencesData?.currencyCode || 'BRL',
				value: cart?.value / 100,
				coupon: cart?.marketingData?.coupon,
				shipping_tier: shippingSelected?.label,
				payment_type: cart?.payments[0].name,
				items: items
			}

			GAService.logEvent('add_payment_info', currentPage, params)
		} catch (error) {
			GAService.logError('Error on begin checkout', error, currentPage)
		}
	}

	static viewItemList = (items, origin, search, currentPage) => {
		try {
			const listItems = items.products.map(item => {

				return {
					item_id: item.productId,
					item_name: item.productName,
					item_brand: item.brand,
					price: item.items[0].sellers[0].commertialOffer.Price
				}
			})
			const params = {
				item_list_id: search,
				item_list_name: origin,
				items: listItems
			}

			GAService.logEvent('view_item_list', currentPage, params)
		} catch (error) {
			GAService.logError('Error on viewItemList', error, currentPage)
		}
	}

	static sendViewItem = (product, currentPage) => {
		try {
			const params = {
				currency: 'BRL',
				value: product?.items[0]?.sellers[0]?.commertialOffer?.Price,
				items: [
					{
						item_id: product.productId,
						item_name: product.productName,
						item_brand: product.brand,
						price: product.items[0].sellers[0].commertialOffer.Price
					}
				]
			}

			GAService.logEvent('view_item', currentPage, params)
		} catch (error) {
			GAService.logError('Error on sendViewItem', error, currentPage)
		}
	}

	static purchase = (cart) => {
    try {
      const items = cart.products.map(product => {
        return {
          item_id: product.productVariantId,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity
        }
      })

      const params = {
        currency: 'BRL',
        value: cart?.total,
        transaction_id: "T_12345",
        shipping: cart?.shippingFee,
        items: items
      }

      GAService.logEvent('purchase', params)
    } catch (error) {
      GAService.logError('Error on purchase', error)
    }
	}
}
