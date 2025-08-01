import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function GraphqlSearchMethods() {
	const getProducts = async () => {
		const res = await Vtex.searchGraphql.productSearch(
			{
				selectedFacets: [
					{
						key: 'category-1',
						value: 'masculino'
					}
				]
			},
			`{ 
			operator
		}`
		)
		console.log(res)
	}

	return (
		<Window
			topInset
			bottomInset
			title='Métodos de Configurações Vtex'>
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
					onPress={getProducts}
					label='Buscar produtos'
				/>
			</View>
		</Window>
	)
}
