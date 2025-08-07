import Eitri from 'eitri-bifrost'
import Tracking from '../services/Tracking'

export default function GAEcommerceMethods() {
	const [msgDebug, setMsgDebug] = useState(null)

	const testAddToCart = async () => {
		try {
			const mockItem = {
				id: 'test-product-123',
				name: 'Test Product',
				brand: 'Test Brand',
				categories: ['Electronics', 'Smartphones'],
				price: 299.99,
				quantity: 1
			}

			const mockCart = {
				currency: 'BRL',
				items: [mockItem]
			}

			Tracking.gaInternal.addItemToCart(mockItem, mockCart)
			setMsgDebug('Add to cart event sent successfully')
		} catch (error) {
			setMsgDebug('Error on add to cart: ' + error.message)
		}
	}

	const testRemoveFromCart = async () => {
		try {
			const mockItem = {
				id: 'test-product-123',
				name: 'Test Product',
				brand: 'Test Brand',
				categories: ['Electronics', 'Smartphones'],
				price: 299.99,
				quantity: 1
			}

			const mockCart = {
				currency: 'BRL',
				items: []
			}

			Tracking.gaInternal.removeItemFromCart(mockItem, mockCart)
			setMsgDebug('Remove from cart event sent successfully')
		} catch (error) {
			setMsgDebug('Error on remove from cart: ' + error.message)
		}
	}

	const testViewItem = async () => {
		try {
			const mockItem = {
				id: 'test-product-456',
				name: 'Another Test Product',
				brand: 'Test Brand',
				categories: ['Clothing', 'T-Shirts'],
				price: 89.99,
				quantity: 1
			}

			Tracking.gaInternal.viewItem(mockItem)
			setMsgDebug('View item event sent successfully')
		} catch (error) {
			setMsgDebug('Error on view item: ' + error.message)
		}
	}

	const testViewItemList = async () => {
		try {
			const mockItems = [
				{
					id: 'test-product-1',
					name: 'Product 1',
					brand: 'Brand A',
					categories: ['Category 1'],
					price: 19.99,
					quantity: 1
				},
				{
					id: 'test-product-2',
					name: 'Product 2',
					brand: 'Brand B',
					categories: ['Category 2'],
					price: 29.99,
					quantity: 1
				}
			]

			Tracking.gaInternal.viewItemList(mockItems, 'Search Results')
			setMsgDebug('View item list event sent successfully')
		} catch (error) {
			setMsgDebug('Error on view item list: ' + error.message)
		}
	}

	const testBeginCheckout = async () => {
		try {
			const mockCart = {
				currency: 'BRL',
				totalValue: 199.98,
				items: [
					{
						id: 'test-product-1',
						name: 'Product 1',
						brand: 'Brand A',
						categories: ['Category 1'],
						price: 99.99,
						quantity: 2
					}
				]
			}

			Tracking.gaInternal.beginCheckout(mockCart)
			setMsgDebug('Begin checkout event sent successfully')
		} catch (error) {
			setMsgDebug('Error on begin checkout: ' + error.message)
		}
	}

	const testPurchase = async () => {
		try {
			const mockCart = {
				currency: 'BRL',
				totalValue: 349.98,
				shippingCost: 15.00,
				items: [
					{
						id: 'test-product-1',
						name: 'Product 1',
						brand: 'Brand A',
						categories: ['Category 1'],
						price: 99.99,
						quantity: 2
					},
					{
						id: 'test-product-2',
						name: 'Product 2',
						brand: 'Brand B',
						categories: ['Category 2'],
						price: 149.99,
						quantity: 1
					}
				]
			}

			const orderId = 'ORDER-' + Date.now()
			Tracking.gaInternal.purchase(mockCart, orderId)
			setMsgDebug(`Purchase event sent successfully. Order ID: ${orderId}`)
		} catch (error) {
			setMsgDebug('Error on purchase: ' + error.message)
		}
	}

	const copyText = async () => {
		await Eitri.clipboard.setText({
			text: JSON.stringify(msgDebug)
		})
	}

	return (
		<Window
			topInset
			bottomInset
			title='Métodos GA E-commerce'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
				
				<Button
					wide
					color='background-color'
					onPress={testAddToCart}
					label='Test Add to Cart'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={testRemoveFromCart}
					label='Test Remove from Cart'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={testViewItem}
					label='Test View Item'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={testViewItemList}
					label='Test View Item List'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={testBeginCheckout}
					label='Test Begin Checkout'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={testPurchase}
					label='Test Purchase'
				/>
			</View>

			{msgDebug && (
				<View>
					<View
						padding='medium'
						gap={12}
						direction='column'
						overflow='scroll'>
						<Text
							display='flex'
							borderWidth='hairline'
							borderColor='primary-700'
							padding='small'>
							{typeof msgDebug === 'object' ? JSON.stringify(msgDebug) : msgDebug}
						</Text>
					</View>
					<Touchable
						onPress={copyText}
						width='100%'
						direction='row'
						alignItems='center'
						justifyContent='center'>
						<View
							backgroundColor='neutral-900'
							padding='small'
							display='flex'
							borderWidth='hairline'
							borderRadius='small'
							alignItems='center'
							justifyContent='center'>
							<Text color='neutral-100'>Copiar</Text>
						</View>
					</Touchable>
				</View>
			)}
		</Window>
	)
}
