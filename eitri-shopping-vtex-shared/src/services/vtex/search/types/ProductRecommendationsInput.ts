export type ProductRecommendationsInput = {
	identifier: {
		field: 'id' | 'slug' | 'reference' | 'ean' | 'sku'
		value: string
	}
	type: 'buy' | 'similars' | 'view' | 'viewAndBought' | 'accessories' | 'suggestions'
	groupBy: 'PRODUCT' | 'NONE'
}
