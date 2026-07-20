import Vtex from '../services/Vtex'

export default function IntelligentSearchMethods() {
	const topSearches = async () => {
		const result = await Vtex.intelligentSearch.topSearches()
		console.log('topSearches', result)
	}

	const autocompleteSuggestions = async () => {
		const result = await Vtex.intelligentSearch.autocompleteSuggestions('camisa')
		console.log('autocompleteSuggestions', result)
	}

	const searchSuggestions = async () => {
		const result = await Vtex.intelligentSearch.searchSuggestions('camisa')
		console.log('searchSuggestions', result)
	}

	const correctionSearch = async () => {
		const result = await Vtex.intelligentSearch.correctionSearch('camsa')
		console.log('correctionSearch', result)
	}

	const productSearch = async () => {
		const result = await Vtex.intelligentSearch.productSearch('', {
			query: 'camisa',
			count: 10,
			page: 1
		})
		console.log('productSearch', result)
	}

	const productSearchByFacets = async () => {
		const result = await Vtex.intelligentSearch.productSearch([{ key: 'category-1', value: 'roupas' }])
		console.log('productSearchByFacets', result)
	}

	const facets = async () => {
		const result = await Vtex.intelligentSearch.facets('', {
			query: 'camisa'
		})
		console.log('facets', result)
	}

	const banners = async () => {
		const result = await Vtex.intelligentSearch.banners('', {
			query: 'camisa'
		})
		console.log('banners', result)
	}

	const getProduct = async () => {
		const result = await Vtex.intelligentSearch.getProduct('5137', 'id')
		console.log('getProduct', result)
	}

	const pickupPointAvailability = async () => {
		const result = await Vtex.intelligentSearch.pickupPointAvailability('')
		console.log('pickupPointAvailability', result)
	}

	const METHODS = [
		{
			label: 'Termos mais buscados',
			executor: topSearches
		},
		{
			label: 'Sugestões de autocomplete',
			executor: autocompleteSuggestions
		},
		{
			label: 'Sugestões de busca',
			executor: searchSuggestions
		},
		{
			label: 'Correção de termo',
			executor: correctionSearch
		},
		{
			label: 'Buscar produtos',
			executor: productSearch
		},
		{
			label: 'Buscar produtos por facets (array)',
			executor: productSearchByFacets
		},
		{
			label: 'Listar filtros (facets)',
			executor: facets
		},
		{
			label: 'Banners',
			executor: banners
		},
		{
			label: 'Obter produto (PDP)',
			executor: getProduct
		},
		{
			label: 'Pontos de retirada',
			executor: pickupPointAvailability
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
