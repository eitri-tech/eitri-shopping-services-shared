// @ts-ignore
import { Window, View, Button } from 'eitri-luminus'
import { Shopify } from '@/export'

export default function Cart(props) {
	const getCart = async () => {
		try {
			const cart = await Shopify.cart.generateNewCart()
			console.log('cart==>', cart)
		} catch (error) {
			console.error(error)
		}
	}

	const methods = [
		{
			name: 'Cart',
			executor: getCart
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
