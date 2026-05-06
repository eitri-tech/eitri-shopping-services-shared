import Vtex from '../services/Vtex'

export default function ProductsToSummaryMethods() {
	const getProductsToSummary = async () => {
		try {
			const res = await Vtex.searchGraphql.productsToSummary({
				specificationFilters: ['specificationFilter_68:Luxury Softness 039K'],
				from: 0,
				to: 10
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	return (
		<Window
			topInset
			bottomInset
			title='Products To Summary'>
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
					onPress={getProductsToSummary}
					label='Buscar Products To Summary'
				/>
			</View>
		</Window>
	)
}
