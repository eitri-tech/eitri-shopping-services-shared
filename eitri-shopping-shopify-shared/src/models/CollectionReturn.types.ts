import { Product } from './Product'

export interface CollectionReturn {
	handle: string
	id: string
	title: string
	description: string
	descriptionHtml: string
	image: {
		url: string
		height: number
		width: number
		id: string
	}
	products: ProductsConnection
}

// Products connection
export interface ProductsConnection {
	pageInfo: PageInfo
	nodes: Product[]
	filters: Filter[]
}

// PageInfo
export interface PageInfo {
	hasNextPage: boolean
	hasPreviousPage: boolean
	startCursor: string
	endCursor: string
}

// Filters
export interface Filter {
	id: string
	label: string
	presentation: 'TEXT' | string
	type: 'LIST' | string
	values: FilterValue[]
}

export interface FilterValue {
	count: number
	id: string
	input: string // JSON string vindo da API
	label: string
}
