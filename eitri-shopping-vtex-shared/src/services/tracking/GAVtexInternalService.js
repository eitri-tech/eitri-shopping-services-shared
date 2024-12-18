import GAService from './GAService'

export default class GAVtexInternalService {

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

	static addItemToCart = (addedItems, cart, currentPage = null) => {
		try {

			let items = []
			if (Array.isArray(addedItems)) {
				items = addedItems.map((addedItem, index) => {
					const item = cart.items.find(i => i.id === addedItem.id)
					if (!item) {
						return null
					}

					const categories = GAVtexInternalService._resolveCategory(item)

					return {
						item_id: item.id,
						item_name: item.skuName,
						item_brand: item.additionalInfo?.brandName,
						...categories,
						price: item.price / 100,
						quantity: item.quantity
					}
				})
			} else {
				const categories = GAVtexInternalService._resolveCategory(addedItems)

				items.push({
					item_id: addedItems?.productId,
					item_name: addedItems?.productName || addedItems?.name,
					item_brand: addedItems?.brand || null,
					...categories,
					price: addedItems?.items
						? addedItems?.items[0]?.sellers[0]?.commertialOffer?.Price
						: addedItems?.price / 100,
					quantity: addedItems.quantity
				})
			}

			const params = {
				currency: cart?.storePreferencesData?.currencyCode || 'BRL',
				value: items[0]?.price,
				items: items
			}

			GAService.logEvent('add_to_cart', currentPage, params)
		} catch (e) {
			GAService.logError('Error on addItemToCart', e, currentPage)
		}
	}

	static viewCart = (cart, currentPage = null) => {
		try {

			const items = cart?.items.map(item => {
				const categories = GAVtexInternalService._resolveCategory(item)

				return {
					item_id: item.id,
					item_name: item.skuName,
					item_brand: item.additionalInfo?.brandName,
					...categories,
					price: item.price / 100,
					quantity: item.quantity
				}
			})

			const params = {
				currency: cart?.storePreferencesData?.currencyCode || 'BRL',
				value: cart.value / 100,
				items: items
			}

			GAService.logEvent('view_cart', currentPage, params)
		} catch (e) {
			GAService.logError('Error on viewCart', e, currentPage)
		}
	}

	static removeItemFromCart = (itemRemoved, currentPage = null) => {
		try {

			const categories = GAVtexInternalService._resolveCategory(itemRemoved)

			let item = {
				item_id: itemRemoved.id,
				item_name: itemRemoved.skuName,
				item_brand: itemRemoved.additionalInfo?.brandName,
				...categories,
				price: itemRemoved.price / 100,
				quantity: itemRemoved.quantity
			}

			const params = {
				currency: 'BRL',
				value: itemRemoved.price / 100,
				items: [item]
			}

			GAService.logEvent('remove_from_cart', currentPage, params)
		} catch (e) {
			GAService.logError('Error on removeItemToCart', e, currentPage)
		}
	}

	static beginCheckout = (cart, currentPage = null) => {
		try {

			const items = cart.items.map((addedItem, index) => {
				const item = cart.items.find(i => i.id === addedItem.id)
				if (!item) {
					return null
				}

				const categories = GAVtexInternalService._resolveCategory(item)

				return {
					item_id: item.id,
					item_name: item.skuName,
					item_brand: item.additionalInfo?.brandName,
					...categories,
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

	static addShippingInfo = (cart, currentPage = null) => {
		try {
			const items = cart.items.map((addedItem, index) => {
				const item = cart.items.find(i => i.id === addedItem.id)
				if (!item) {
					return null
				}

				const categories = GAVtexInternalService._resolveCategory(item)

				return {
					item_id: item.id,
					item_name: item.skuName,
					item_brand: item.additionalInfo?.brandName,
					...categories,
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
				items: items
			}

			GAService.logEvent('add_shipping_info', currentPage, params)
		} catch (error) {
			GAService.logError('Error on begin checkout', error, currentPage)
		}
	}

	static addPaymentInfo = (cart, currentPage = null) => {
		try {
			const items = cart.items.map((addedItem, index) => {
				const item = cart.items.find(i => i.id === addedItem.id)
				if (!item) {
					return null
				}

				const categories = GAVtexInternalService._resolveCategory(item)

				return {
					item_id: item.id,
					item_name: item.skuName,
					item_brand: item.additionalInfo?.brandName,
					...categories,
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
				const categories = GAVtexInternalService._resolveCategory(item)

				return {
					item_id: item.productId,
					item_name: item.productName,
					item_brand: item.brand,
					...categories,
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
			const categories = GAVtexInternalService._resolveCategory(product)

			const params = {
				currency: 'BRL',
				value: product?.items[0]?.sellers[0]?.commertialOffer?.Price,
				items: [
					{
						item_id: product.productId,
						item_name: product.productName,
						item_brand: product.brand,
						...categories,
						price: product.items[0].sellers[0].commertialOffer.Price
					}
				]
			}

			GAService.logEvent('view_item', currentPage, params)
		} catch (error) {
			GAService.logError('Error on sendViewItem', error, currentPage)
		}
	}
}
