// @ts-ignore
import { Window, View, Button } from 'eitri-luminus'
import { Shopify } from '@/export'

export default function Cart(props) {
	const generateNewCart = async () => {
		try {
			const cart = await Shopify.cart.generateNewCart()
			console.log('cart==>', cart)
		} catch (error) {
			console.error(error)
		}
	}

	const getCurrentOrCreateCart = async () => {
		try {
			const cart = await Shopify.cart.getCurrentOrCreateCart()
			console.log('cart==>', cart)
		} catch (error) {
			console.error(error)
		}
	}

	const cartAttributesUpdate = async () => {
		try {
			const cart = await Shopify.cart.cartAttributesUpdate([{ key: 'tested', value: 'b' }])
			console.log('cart==>', cart)
		} catch (error) {
			console.error(error)
		}
	}

	const methods = [
		{
			name: 'Generate Cart',
			executor: generateNewCart
		},
		{
			name: 'Get Cart',
			executor: getCurrentOrCreateCart
		},
		{
			name: 'cartAttributesUpdate',
			executor: cartAttributesUpdate
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
				{methods?.map(m => (
					<Button
						wide
						color='background-color'
						onPress={m.executor}
						label={m.name}
					/>
				))}
			</View>
		</Window>
	)
}
