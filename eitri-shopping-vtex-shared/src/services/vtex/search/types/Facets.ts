export type Facets = {
	fullText: string
	selectedFacets: {
		key: string
		value: string
	}[]
	hideUnavailableItems: boolean
	removeHiddenFacets: boolean
	behavior: string
	operator: string
	fuzzy: string
	searchState: string
	from: number
	to: number
	categoryTreeBehavior: string
	initialAttributes: string
}
