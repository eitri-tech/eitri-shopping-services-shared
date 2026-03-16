import Vtex from '../services/Vtex'

export default function CatalogMethods() {
	const getCart = async () => {
		const cart = await Vtex.cart.getCurrentOrCreateCart()
	}

	const getProduct = async () => {
		const product = await Vtex.catalog.getProductById('5137')
		console.log(product)
	}

	const search = async () => {
		const product = await Vtex.catalog.getProductsByFacets('', {
			query: 'strass'
		})
		console.log(product)
	}

	const showTogether = async () => {
		const product = await Vtex.catalog.showTogether(3729693)
		console.log(product)
	}

	const METHODS = [
		{
			label: 'Obter produto por id',
			executor: getProduct
		},
		{
			label: 'Buscar Produtos',
			executor: search
		},
		{
			label: 'Compre junto',
			executor: showTogether
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
				{METHODS.map(method => (
					<Button
						wide
						color='background-color'
						onPress={method.executor}
						label={method.label}
					/>
				))}
			</View>
		</Window>
	)
}
