// Enums
export enum SearchPrefixQueryType {
	LAST = 'LAST',
	NONE = 'NONE'
}

export enum SearchSortKeys {
	PRICE = 'PRICE',
	RELEVANCE = 'RELEVANCE'
}

export enum SearchType {
	ARTICLE = 'ARTICLE',
	PAGE = 'PAGE',
	PRODUCT = 'PRODUCT'
}

export enum SearchUnavailableProductsType {
	HIDE = 'HIDE',
	LAST = 'LAST',
	SHOW = 'SHOW'
}

// Product Filter Input
export interface ProductFilter {
	available?: boolean
	price?: {
		max?: number
		min?: number
	}
	productType?: string
	productVendor?: string
	tag?: string
	variantOption?: {
		name: string
		value: string
	}
}

// Main Search Arguments Interface
export interface SearchQueryArguments {
	/** The search query */
	query: string

	/** Returns the elements that come after the specified cursor */
	after?: string

	/** Returns the elements that come before the specified cursor */
	before?: string

	/** Returns up to the first n elements from the list */
	first?: number

	/** Returns up to the last n elements from the list */
	last?: number

	/** Specifies whether to perform a partial word match on the last search term */
	prefix?: SearchPrefixQueryType

	/** Returns a subset of products matching all product filters (max 250 values) */
	productFilters?: ProductFilter[]

	/** Reverse the order of the underlying list */
	reverse?: boolean

	/** Sort the underlying list by the given key */
	sortKey?: SearchSortKeys

	/** The types of resources to search for (max 250 values) */
	types?: SearchType[]

	/** Specifies how unavailable products or variants are displayed in the search results */
	unavailableProducts?: SearchUnavailableProductsType
}
