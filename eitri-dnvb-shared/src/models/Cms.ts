/** Valores conhecidos + string: o CMS aceita valores novos antes do app saber renderizá-los. */
export type Open<T extends string> = T | (string & {})

export interface CmsImage {
	url: string
	alt: string
	width?: number
	height?: number
}

/** Documento cru do CMS, para content-types que o SDK não tipa (ex.: páginas da loja). */
export interface CmsContent {
	id?: string
	slug?: string
	updatedAt?: string
	[field: string]: unknown
}

export interface CmsSection {
	blockType: string
	[field: string]: unknown
}

export interface CmsListOptions {
	full?: boolean
	/** Vira `filter[<campo>]=<valor>`; o campo segue os `indexes` do content-type (ex.: `products[*].productId`). */
	filter?: Record<string, string>
}
