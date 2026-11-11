import GAService from './GAService'
import WakeService from '@/services/WakeService'

/*
	[GA4] Revisão dos eventos de ecommerce (validação do GA4 no app Shop2gether), seguindo a referência
	https://developers.google.com/analytics/devguides/collection/ga4/reference/events:
	- os itens passam a ser montados pelo mountItem: além de item_id (productVariantId), item_name, price e
	  quantity, levam item_variant, item_category e discount quando o checkout traz esses dados
	- coupon no add_shipping_info, no add_payment_info e no purchase
	- purchase com shipping e com itens mesmo quando o checkoutComplete volta sem produtos (Pix)
*/
export default class GAWakeInternalService {
	static toNumber = value => {
		if (value === null || value === undefined || value === '') return null

		const number = Number(value)

		return Number.isFinite(number) ? number : null
	}

	/**
	 * [GA4] Item de ecommerce a partir de um produto do checkout da Wake (checkout.products). Os campos
	 * opcionais só entram quando têm valor, para o evento não chegar com item_variant ou discount vazios.
	 * @param {Object} product - produto de checkout.products
	 * @param {number} [quantity] - quantidade do evento (ex.: só a adicionada no add_to_cart); padrão: a da linha
	 */
	static mountItem = (product, quantity = product?.quantity) => {
		const item = {
			item_id: product?.productVariantId,
			item_name: product?.name,
			price: product?.price,
			quantity
		}

		// atributos da variante, ex.: "P/Preto"
		const variant = Array.isArray(product?.productAttributes)
			? product.productAttributes
					.map(attribute => attribute?.value)
					.filter(Boolean)
					.join('/')
			: ''

		if (variant) item.item_variant = variant

		if (typeof product?.category === 'string' && product.category) item.item_category = product.category

		const price = GAWakeInternalService.toNumber(product?.price)
		const listPrice = GAWakeInternalService.toNumber(product?.listPrice)

		if (price !== null && listPrice !== null && listPrice > price) item.discount = +(listPrice - price).toFixed(2)

		return item
	}

	static addItemToCart = (addedItems, cart) => {
		console.log('addItemToCart', WakeService?.configs?.autoTriggerGAEvents)
		if (!WakeService?.configs?.autoTriggerGAEvents) {
			return
		}
		try {
			let items = addedItems
				.map(addedItem => {
					const item = cart.products.find(i => i.productVariantId === addedItem.productVariantId)

					if (!item) {
						return null
					}

					// [GA4] item completo (variante, categoria, desconto), com a quantidade adicionada
					return GAWakeInternalService.mountItem(item, addedItem.quantity)
				})
				.filter(item => !!item)

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
		if (!WakeService?.configs?.autoTriggerGAEvents) {
			return
		}
		try {
			let items = itemsRemoved
				.map(removedItem => {
					const item = cart.products.find(i => i.productVariantId === removedItem.productVariantId)

					if (!item) {
						return null
					}

					// [GA4] item completo (variante, categoria, desconto), com a quantidade removida
					return GAWakeInternalService.mountItem(item, removedItem.quantity)
				})
				.filter(item => !!item)

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
		if (!WakeService?.configs?.autoTriggerGAEvents) {
			return
		}
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

	/**
	 * [GA4] shipping_tier do frete escolhido. Com mais de um centro de distribuição a Wake devolve um frete por
	 * grupo (selectedShippingGroups): o tier junta os nomes, sem repetir.
	 */
	static getShippingTier = cart => {
		if (cart?.selectedShipping?.name) return cart.selectedShipping.name

		const names = (cart?.selectedShippingGroups || []).map(group => group?.selectedShipping?.name).filter(Boolean)

		return [...new Set(names)].join(' / ')
	}

	static addShippingInfo = cart => {
		if (!WakeService?.configs?.autoTriggerGAEvents) {
			return
		}
		try {
			// [GA4] item completo (variante, categoria, desconto)
			const items = cart.products.map(product => GAWakeInternalService.mountItem(product))

			const params = {
				currency: 'BRL',
				value: cart?.total,
				// [GA4] frete de cada grupo quando o checkout tem mais de um centro de distribuição
				shipping_tier: GAWakeInternalService.getShippingTier(cart),
				items: items
			}

			// [GA4] coupon é parâmetro recomendado do add_shipping_info
			if (cart?.coupon) params.coupon = cart.coupon

			GAService.logEvent('add_shipping_info', params)
		} catch (error) {
			GAService.logError('Error on add shipping info', error)
		}
	}

	static addPaymentInfo = (cart, paymentMethods) => {
		if (!WakeService?.configs?.autoTriggerGAEvents) {
			return
		}
		try {
			// [GA4] item completo (variante, categoria, desconto)
			const items = cart.products.map(product => GAWakeInternalService.mountItem(product))

			const selectedPaymentMethod = paymentMethods?.find(
				method => method.id === cart?.selectedPaymentMethod?.paymentMethodId
			)

			const params = {
				currency: 'BRL',
				value: cart?.total,
				payment_type: selectedPaymentMethod?.name ?? '',
				items: items
			}

			// [GA4] coupon é parâmetro recomendado do add_payment_info
			if (cart?.coupon) params.coupon = cart.coupon

			GAService.logEvent('add_payment_info', params)
		} catch (error) {
			// [GA4] a mensagem dizia "begin checkout", o que confundia a leitura dos erros
			GAService.logError('Error on add payment info', error)
		}
	}

	/**
	 * [GA4] Produtos do purchase. No Pix o checkoutComplete volta com products vazio (e subtotal zerado), e o
	 * evento saía com items: []. Nesse caso usa o checkout lido antes de finalizar (o mesmo checkoutId) e, sem
	 * ele, os produtos do pedido.
	 * @param {Object} cart - resposta do checkoutComplete
	 * @param {Object} [checkoutBeforeComplete] - último checkout lido antes de finalizar (CartService.CACHED_CART)
	 */
	static getPurchaseProducts = (cart, checkoutBeforeComplete) => {
		if (cart?.products?.length > 0) return cart.products

		if (
			checkoutBeforeComplete?.checkoutId &&
			checkoutBeforeComplete.checkoutId === cart?.checkoutId &&
			checkoutBeforeComplete.products?.length > 0
		) {
			return checkoutBeforeComplete.products
		}

		// último recurso: os produtos do pedido. O value do produto do pedido entra como preço unitário
		// (conferir no DebugView se bate com o preço da linha)
		return (cart?.orders || [])
			.flatMap(order => order?.products || [])
			.map(product => ({
				productVariantId: product?.productVariantId,
				name: product?.name,
				price: product?.value,
				quantity: product?.quantity,
				productAttributes: product?.attributes
			}))
	}

	static sumOrders = (cart, field) => {
		const values = (cart?.orders || [])
			.map(order => GAWakeInternalService.toNumber(order?.[field]))
			.filter(value => value !== null)

		return values.length > 0 ? +values.reduce((total, value) => total + value, 0).toFixed(2) : null
	}

	/**
	 * @param {Object} cart - resposta do checkoutComplete
	 * @param {Object} [checkoutBeforeComplete] - último checkout lido antes de finalizar (CartService.CACHED_CART)
	 */
	static purchase = (cart, checkoutBeforeComplete) => {
		if (!WakeService?.configs?.autoTriggerGAEvents) {
			return
		}
		try {
			// [GA4] itens também no Pix, em que o checkoutComplete volta sem produtos
			const items = GAWakeInternalService.getPurchaseProducts(cart, checkoutBeforeComplete).map(product =>
				GAWakeInternalService.mountItem(product)
			)

			const params = {
				currency: 'BRL',
				// [GA4] o total do checkout segue como value; zerado, usa o total dos pedidos
				value:
					GAWakeInternalService.toNumber(cart?.total) || GAWakeInternalService.sumOrders(cart, 'totalValue'),
				transaction_id: cart?.orders?.[0]?.orderId || cart?.checkoutId,
				items: items
			}

			// [GA4] shipping do pedido (o mesmo valor cobrado); sem pedido, o frete do checkout
			const shipping =
				GAWakeInternalService.sumOrders(cart, 'shippingValue') ??
				GAWakeInternalService.toNumber(cart?.shippingFee)

			if (shipping !== null) params.shipping = shipping

			// [GA4] coupon do pedido; no Pix pode vir só no checkout lido antes de finalizar
			const isSameCheckout =
				!!checkoutBeforeComplete?.checkoutId && checkoutBeforeComplete.checkoutId === cart?.checkoutId
			const coupon = cart?.coupon || (isSameCheckout ? checkoutBeforeComplete.coupon : null)

			if (coupon) params.coupon = coupon

			GAService.logEvent('purchase', params)
		} catch (error) {
			GAService.logError('Error on purchase', error)
		}
	}
}
