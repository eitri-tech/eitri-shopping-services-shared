import Vtex from '../services/Vtex'

export default function CartMethods() {
	const clearCart = async () => {
		const cart = await Vtex.cart.clearCart()
	}

	const getCart = async () => {
		const cart = await Vtex.cart.getCurrentOrCreateCart()
		console.log(cart)
	}

	const addToCart = async () => {
		try {
			const item = {
				id: '1001',
				quantity: 1,
				seller: '1'
			}
			const cart = await Vtex.cart.addItem(item)
		} catch (e) {
			console.error('loadProduct: Error', e)
		}
	}

	const removeFromCart = async () => {
		const cart = await Vtex.cart.removeItem(1)
	}

	const simulateCart = async () => {
		try {
			const address = await Vtex.checkout.resolveZipCode('20541195')
			const { postalCode, city, state, street, neighborhood, country, geoCoordinates } = address

			const cartSimulationPayload = {
				items: [
					{
						id: '310118597',
						quantity: '1',
						seller: '1'
					}
				],
				shippingData: {
					selectedAddresses: [
						{
							addressType: '',
							receiverName: '',
							addressId: '',
							isDisposable: true,
							postalCode: postalCode,
							city: city,
							state: state,
							country: country,
							street: street,
							number: null,
							neighborhood: neighborhood,
							complement: null,
							reference: null,
							geoCoordinates: geoCoordinates
						}
					]
				}
			}
			const cart = await Vtex.cart.simulateCart(cartSimulationPayload, '6')
			console.log(cart)
		} catch (e) {
			console.error('loadProduct: Error', e)
		}
	}

	const addMarketingData = async () => {
		try {
			const cart = await Vtex.cart.addMarketingData({
				"utmMedium": "LT00002"
			}, true)
			console.log("marketingData result", cart?.marketingData )
		} catch (e) {
			console.error('addMarketingData: Error', e)
		}
	}


	const METHODS = [
		{
			label: 'Limpar carrinho',
			onPress: clearCart
		},
		{
			label: 'Obter ou criar carrinho',
			onPress: getCart
		},
		{
			label: 'Adicionar ao carrinho',
			onPress: addToCart
		},
		{
			label: 'Remover do carrinho',
			onPress: removeFromCart
		},
		{
			label: 'Simulate cart',
			onPress: simulateCart
		},
		{
			label: 'Add Marketing Data',
			onPress: addMarketingData
		}
	]

	return (
		<Window
			topInset
			bottomInset>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				width='100%'>

				{
					METHODS.map((method, index) => (
						<Button
							key={index}
							wide
							color='background-color'
							onPress={method.onPress}
							label={method.label}
						/>
					))
				}

			</View>
		</Window>
	)
}
