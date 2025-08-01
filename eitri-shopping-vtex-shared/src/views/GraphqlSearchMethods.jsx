import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function GraphqlSearchMethods() {
	const getProducts = async () => {
		try {
			const res = await Vtex.searchGraphql.productSearch({
				selectedFacets: [
					{
						key: 'category-1',
						value: 'masculino'
					}
				]
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getFacets = async () => {
		try {
			const res = await Vtex.searchGraphql.facets({
				selectedFacets: [
					{
						key: 'category-1',
						value: 'masculino'
					}
				]
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getProduct = async () => {
		try {
			const res = await Vtex.searchGraphql.product({
				slug: 'camisa-polo-plus-size-masculina-algodao-peruano-bege-21322000499028'
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getSearchSuggestion = async () => {
		try {
			const res = await Vtex.searchGraphql.searchSuggestions({
				fullText: 'camisa'
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getProductRecommendation = async () => {
		try {
			const res = await Vtex.searchGraphql.productRecommendations({
				identifier: {
					field: 'id',
					value: '1779'
				},
				type: 'viewAndBought'
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getAutocomplete = async () => {
		try {
			const res = await Vtex.searchGraphql.autocomplete({
				searchTerm: 'Camisa'
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getAutocompleteSearchSuggestions = async () => {
		try {
			const res = await Vtex.searchGraphql.autocompleteSearchSuggestions({
				fullText: 'Camisa'
			})
			console.log(res)
		} catch (e) {
			console.log(e)
		}
	}

	const getTopSearches = async () => {
		try {
			const res = await Vtex.searchGraphql.topSearches()
			console.log(res)
		} catch (e) {
			console.log(e)
		}
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
				<Button
					wide
					color='background-color'
					onPress={getFacets}
					label='Buscar facets'
				/>
				<Button
					wide
					color='background-color'
					onPress={getProduct}
					label='Buscar produto'
				/>
				<Button
					wide
					color='background-color'
					onPress={getSearchSuggestion}
					label='Sugestão de busca'
				/>
				<Button
					wide
					color='background-color'
					onPress={getProductRecommendation}
					label='Recomendacao de produto'
				/>

				<Button
					wide
					color='background-color'
					onPress={getAutocomplete}
					label='Autocomplete'
				/>

				<Button
					wide
					color='background-color'
					onPress={getAutocompleteSearchSuggestions}
					label='Autocomplete Search Suggestions'
				/>

				<Button
					wide
					color='background-color'
					onPress={getTopSearches}
					label='Top Searchs'
				/>
			</View>
		</Window>
	)
}
