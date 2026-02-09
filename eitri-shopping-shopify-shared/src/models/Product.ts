export interface Product {
	category: Category
	handle: string
	id: string
	description: string
	descriptionHtml: string
	images: Images
	isGiftCard: boolean
	title: string
	variants: Variants
}

export interface Category {
	id: string
	name: string
}

export interface Images {
	nodes: ImageElement[]
}

export interface ImageElement {
	url: string
	height: number
	width: number
	thumbhash: string
	id: string
	altText?: string | null
}

export interface Variants {
	nodes: ProductVariantsNode[]
}

export interface ProductVariantsNode {
	availableForSale: boolean
	barcode: string
	compareAtPrice: Price
	id: string
	image: ImageElement
	price: Price
	sku: string
	title: string
}

export interface Price {
	amount: string
	currencyCode: string
}
