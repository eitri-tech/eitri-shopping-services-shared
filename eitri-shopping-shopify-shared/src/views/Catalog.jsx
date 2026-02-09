import { Window } from 'eitri-luminus'
import { Shopify } from '@/export'

export default function Catalog(props) {
	const getProduct = async () => {
		const product = await Shopify.catalog.product({ handle: 'calca-sarja-sawary-wide-leg-281529-amarelo' })
		console.log('product==>', product)
	}

	const methods = [
		{
			name: 'Product',
			executor: getProduct
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
						label={m.name}/>
				))}
			</View>
		</Window>
	)
}
