// Types for VTEX Intelligent Search API v1
// https://developers.vtex.com/docs/api-reference/intelligent-search-api-v1

export type IntelligentSearchLocale = string

// Facets path segment. Accepts the raw path string ("category-1/clothing")
// or a list of key/value pairs ([{ key: "category-1", value: "clothing" }]).
export type SelectedFacet = {
	key: string
	value: string
}

export type FacetsPath = string | SelectedFacet[]

// ===== Common query options =====

export type SimulationBehavior = 'default' | 'skip' | 'only1P' | 'only3P' | 'regionalize1p'

export type IntelligentSearchSort =
	| ''
	| 'price:desc'
	| 'price:asc'
	| 'orders:desc'
	| 'name:desc'
	| 'name:asc'
	| 'release:desc'
	| 'discount:desc'

export type RegionalizationOptions = {
	sc?: string | number
	regionId?: string
	country?: string
	'zip-code'?: string
	coordinates?: string
	pickupPoint?: string
	deliveryZonesHash?: string
	pickupPointsHash?: string
}

export type SimulationOptions = {
	utmSource?: string
	utmCampaign?: string
	utmiCampaign?: string
	campaigns?: string
	priceTables?: string
}

// ===== Autocomplete =====

export type SearchTermAttribute = {
	key: string
	value: string
	labelKey: string
	labelValue: string
}

export type SearchTerm = {
	term: string
	count: number
	attributes?: SearchTermAttribute[] | null
}

export type IntelligentSearchSuggestions = {
	searches: SearchTerm[]
}

// ===== Correction =====

export type IntelligentSearchCorrection = {
	correction: {
		misspelled: boolean
		correction: boolean
		text: string
		highlighted: string
	}
}

// ===== Banners =====

export type IntelligentSearchBanner = {
	id: string
	name: string
	area: string
	html: string
}

export type IntelligentSearchBanners = {
	banners: IntelligentSearchBanner[]
}

// ===== Product search =====

export type ProductSearchOptions = RegionalizationOptions &
	SimulationOptions & {
		query?: string
		q?: string
		count?: number
		page?: number
		sort?: IntelligentSearchSort
		locale?: IntelligentSearchLocale
		hideUnavailableItems?: boolean
		simulationBehavior?: SimulationBehavior
		showSponsored?: boolean
		sponsoredCount?: number
		advertisementPlacement?: string
		repeatSponsoredProducts?: boolean
	}

export type PriceRange = {
	sellingPrice: { highPrice: number; lowPrice: number }
	listPrice: { highPrice: number; lowPrice: number }
}

export type CommertialOffer = {
	AvailableQuantity: number
	Price: number
	ListPrice: number
	spotPrice?: number
	Tax?: number
	PriceValidUntil?: string
	[key: string]: any
}

export type Seller = {
	sellerId: string
	sellerName?: string
	addToCartLink?: string
	sellerDefault: boolean
	commertialOffer: CommertialOffer
}

export type ProductItem = {
	itemId: string
	name: string
	nameComplete: string
	sellers: Seller[]
	images: any[]
	measurementUnit?: string
	unitMultiplier?: number
	variations?: any[]
	ean?: string
	isKit?: boolean
	[key: string]: any
}

export type IntelligentSearchProduct = {
	cacheId?: string
	productId: string
	productName: string
	description?: string
	productReference?: string
	linkText: string
	brand?: string
	brandId?: number
	link: string
	categories: string[]
	categoryId?: string
	categoriesIds?: string[]
	priceRange: PriceRange
	items: ProductItem[]
	origin?: string
	[key: string]: any
}

export type Pagination = {
	count: number
	current: { index: number }
	before: { index: number }[]
	after: { index: number }[]
	perPage: number
	next?: { index: number }
	previous?: { index: number }
	first?: { index: number }
	last?: { index: number }
}

export type IntelligentSearchProductSearchResult = {
	products: IntelligentSearchProduct[]
	recordsFiltered: number
	correction?: { misspelled: boolean }
	fuzzy?: string
	operator?: 'and' | 'or'
	redirect?: string | null
	translated?: boolean
	pagination: Pagination
	options?: {
		sorts: any[]
		counts: any[]
		deliveryPromisesEnabled: boolean
	}
	searchId?: string
}

// ===== Facets =====

export type FacetsOptions = RegionalizationOptions & {
	query?: string
	q?: string
	locale?: IntelligentSearchLocale
	hideUnavailableItems?: boolean
	removeHiddenFacets?: boolean
}

export type FacetValue = {
	id?: string
	quantity: number
	name: string
	key: string
	value?: string
	selected: boolean
	href?: string
	range?: { from: number; to: number }
}

export type Facet = {
	values: FacetValue[]
	type: 'TEXT' | 'PRICERANGE' | 'DELIVERY'
	name: string
	hidden: boolean
	key: string
	quantity: number
}

export type IntelligentSearchFacetsResult = {
	facets: Facet[]
	sampling: boolean
	breadcrumb: { name: string; href: string }[]
	queryArgs: {
		query: string
		selectedFacets: { key: string; value: string }[]
	}
	translated: boolean
}

// ===== Get product (PDP) =====

export type ProductIdentifierField = 'id' | 'slug' | 'ean' | 'sku' | 'reference'

export type GetProductOptions = RegionalizationOptions &
	SimulationOptions & {
		field?: ProductIdentifierField
		locale?: IntelligentSearchLocale
		simulationBehavior?: SimulationBehavior
		hideUnavailableItems?: boolean
		productClusterId?: string
		productOriginVtex?: boolean
		'show-invisible-items'?: boolean
	}

// ===== Pickup point availability (Delivery Promise) =====

export type PickupPointAvailabilityOptions = RegionalizationOptions & {
	query?: string
	q?: string
	locale?: IntelligentSearchLocale
}

export type PickupPoint = {
	pickupId: string
	pickupName: string
	distance: number
	isActive: boolean
	address: {
		street: string
		number: string
		neighborhood: string
		city: string
		state: string
		postalCode: string
	}
	businessHours: {
		dayOfWeek: number
		openingTime: string
		closingTime: string
	}[]
}

export type IntelligentSearchPickupPointAvailability = {
	pickupPointDistances: PickupPoint[]
}
