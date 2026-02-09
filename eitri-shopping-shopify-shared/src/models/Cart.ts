export interface CartResponse {
	cart: Cart
}

export interface Cart {
	id: string
	createdAt: Date
	updatedAt: Date
	checkoutUrl: string
	totalQuantity: number
	note: string
	attributes: Attribute[]
	cost: CartCost
	lines: {
		nodes: Lines[]
	}
	discountCodes: CartDiscountCode[]
	discountAllocations: DiscountAllocation[]
	appliedGiftCards: AppliedGiftCard[]
	buyerIdentity: BuyerIdentity
	deliveryGroups?: DeliveryGroups
}

export interface CartDiscountCode {
	applicable: boolean
	code: string
}

export interface DiscountAllocation {
	discountedAmount: SubtotalAmount
}

export interface AppliedGiftCard {
	id: string
	lastCharacters: string
	amountUsedV2: SubtotalAmount
	balanceV2: SubtotalAmount
}

export interface Attribute {
	key: string
	value: string
}

export interface BuyerIdentity {
	email: string | null
	phone: string | null
	countryCode: string
	preferences: Preferences
	deliveryAddressPreferences?: DeliveryAddress[]
}

export interface Preferences {
	wallet: string[]
}

export interface CartCost {
	totalAmount: SubtotalAmount
	subtotalAmount: SubtotalAmount
	totalTaxAmount: null
	totalDutyAmount: null
}

export interface SubtotalAmount {
	amount: string
	currencyCode: string
}

export interface Lines {
	id: string
	quantity: number
	merchandise: Merchandise
	attributes: any[]
	cost: NodeCost
	discountAllocations: DiscountAllocation[]
}

export interface NodeCost {
	totalAmount: SubtotalAmount
	amountPerQuantity: SubtotalAmount
}

export interface Merchandise {
	id: string
	title: string
	priceV2: SubtotalAmount
	compareAtPrice?: SubtotalAmount | null
	product: ProductCart
	selectedOptions: SelectedOption[]
	availableForSale: boolean
}

export interface ProductCart {
	id: string
	title: string
	handle: string
	description: string
	featuredImage: FeaturedImage
}

export interface FeaturedImage {
	url: string
	altText: string
}

export interface SelectedOption {
	name: string
	value: string
}

export interface CreateCartInput {
	productVariantId?: string
	quantity?: number
	walletPreference?: unknown
}

export interface UpdateCartInput {
	quantity: number
	merchandiseId: string
}

export interface CartLineUpdateInput {
	id: string
	quantity?: number
	merchandiseId?: string
	attributes?: Attribute[]
}

export interface DeliveryAddress {
	address1?: string
	address2?: string
	city?: string
	province?: string
	country: string
	zip: string
}

export interface DeliveryOption {
	handle: string
	title: string
	estimatedCost: SubtotalAmount
	deliveryMethodType: string
}

export interface DeliveryGroup {
	id?: string
	deliveryOptions: DeliveryOption[]
	selectedDeliveryOption: DeliveryOption | null
}

export interface DeliveryGroups {
	edges: DeliveryGroupEdge[]
}

export interface DeliveryGroupEdge {
	node: DeliveryGroup
}

export interface CartBuyerIdentityInput {
	email?: string
	phone?: string
	countryCode?: string
	deliveryAddressPreferences?: DeliveryAddressInput[]
}

export interface DeliveryAddressInput {
	deliveryAddress: DeliveryAddress
}

export interface DeferredCartResponse {
	data?: {
		cart: Partial<Cart>
	}
	incremental?: Array<{
		path: string[]
		data: {
			deliveryGroups: DeliveryGroups
		}
	}>
	hasNext: boolean
}
