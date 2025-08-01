import { productReturn } from './ProductReturn'

export const productSearchReturn = `{
	products 
		${productReturn}
	recordsFiltered
	operator
	fuzzy
	searchState
	redirect
}`
