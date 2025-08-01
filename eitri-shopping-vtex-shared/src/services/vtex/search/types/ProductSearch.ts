export type ProductSearchInput = {
	fullText: string
	selectedFacets: {
		key: string
		value: string
	}[]
	priceRange: string
	salesChannel: string
	from: number
	to: number
	hideUnavailableItems: boolean
	simulationBehavior: string
	productOriginVtex: boolean
	operator: string
	fuzzy: string
	searchState: string
	options: {
		allowRedirect: boolean
	}
}
