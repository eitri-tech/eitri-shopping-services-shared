import { MoneyV2, CustomerAddress, CustomerUserError } from './Customer'

// ── Shared ──────────────────────────────────────────────────────────────

export interface OrderLineItemImage {
	url: string
	altText: string | null
}

// ── List Orders (used by getOrders) ─────────────────────────────────────

export interface OrderLineItem {
	id: string
	title: string
	quantity: number
	image: OrderLineItemImage | null
	price: MoneyV2
}

export interface CustomerOrder {
	id: string
	name: string
	number: number
	processedAt: string
	createdAt: string
	financialStatus: string
	fulfillmentStatus: string
	totalPrice: MoneyV2
	subtotal: MoneyV2 | null
	totalShipping: MoneyV2 | null
	totalTax: MoneyV2 | null
	lineItems: {
		edges: { node: OrderLineItem }[]
	}
}

export interface CustomerOrderEdge {
	node: CustomerOrder
	cursor: string
}

export interface CustomerOrdersPageInfo {
	hasNextPage: boolean
	hasPreviousPage: boolean
}

export interface CustomerOrdersResponse {
	customer: {
		orders: {
			edges: CustomerOrderEdge[]
			pageInfo: CustomerOrdersPageInfo
		}
	} | null
}

// ── Line Items (Detail) ─────────────────────────────────────────────────

export interface OrderLineItemVariantOption {
	name: string
	value: string
}

export interface OrderDiscountAllocation {
	allocatedAmount: MoneyV2
}

export interface OrderDetailLineItem {
	id: string
	name: string
	title: string
	quantity: number
	refundableQuantity: number
	requiresShipping: boolean
	sku: string | null
	productId: string | null
	productType: string | null
	vendor: string | null
	variantId: string | null
	variantTitle: string | null
	variantOptions: OrderLineItemVariantOption[] | null
	image: OrderLineItemImage | null
	price: MoneyV2 | null
	currentTotalPrice: MoneyV2 | null
	totalPrice: MoneyV2 | null
	totalDiscount: MoneyV2
	discountAllocations: OrderDiscountAllocation[]
	giftCard: boolean
}

// ── Transactions ────────────────────────────────────────────────────────

export interface OrderTransactionPaymentIcon {
	url: string
	altText: string | null
}

export interface OrderTransaction {
	id: string
	createdAt: string
	processedAt: string | null
	type: string
	kind: string | null
	status: string | null
	transactionAmount: {
		presentmentMoney: MoneyV2
		shopMoney: MoneyV2
	}
	paymentIcon: OrderTransactionPaymentIcon | null
	gateway: string | null
	paymentDetails: Record<string, any> | null
	typeDetails: OrderTransactionTypeDetails | null
	giftCardDetails: OrderGiftCardDetails | null
}

export interface OrderTransactionTypeDetails {
	name: string | null
	message: string | null
}

export interface OrderGiftCardDetails {
	last4: string
	balance: MoneyV2
}

// ── Payment Information ─────────────────────────────────────────────────

export interface OrderPaymentSchedule {
	amount: MoneyV2
	dueAt: string | null
	completedAt: string | null
}

export interface OrderPaymentTerms {
	id: string
	paymentTermsName: string
	overdue: boolean
	nextDueAt: string | null
	paymentSchedules: {
		edges: { node: OrderPaymentSchedule }[]
	}
}

export interface OrderPaymentInformation {
	paymentCollectionUrl: string | null
	paymentStatus: string | null
	totalOutstandingAmount: MoneyV2
	totalPaidAmount: MoneyV2
	paymentTerms: OrderPaymentTerms | null
}

// ── Fulfillments ────────────────────────────────────────────────────────

export interface OrderTrackingInformation {
	company: string | null
	number: string | null
	url: string | null
}

export interface OrderFulfillmentEvent {
	id: string
	happenedAt: string
	status: string
}

export interface OrderFulfillmentLineItem {
	id: string
	quantity: number | null
	lineItem: {
		id: string
		title: string
		image: OrderLineItemImage | null
	}
}

export interface OrderFulfillment {
	id: string
	createdAt: string
	updatedAt: string
	status: string | null
	latestShipmentStatus: string | null
	estimatedDeliveryAt: string | null
	requiresShipping: boolean
	isPickedUp: boolean
	trackingInformation: OrderTrackingInformation[]
	fulfillmentLineItems: {
		edges: { node: OrderFulfillmentLineItem }[]
	}
	events: {
		edges: { node: OrderFulfillmentEvent }[]
	}
}

// ── Refunds ─────────────────────────────────────────────────────────────

export interface OrderRefund {
	id: string
	createdAt: string | null
	updatedAt: string
	totalRefunded: MoneyV2
	returnName: string | null
}

// ── Shipping ────────────────────────────────────────────────────────────

export interface OrderShippingLine {
	handle: string | null
	title: string
	originalPrice: MoneyV2
}

// ── Discount Applications ───────────────────────────────────────────────

export interface OrderDiscountApplication {
	allocationMethod: string
	targetSelection: string
	targetType: string
	value: { amount?: string; percentage?: number }
}

// ── Order Detail ────────────────────────────────────────────────────────

export interface OrderDetail {
	id: string
	name: string
	number: number
	confirmationNumber: string | null
	createdAt: string
	processedAt: string
	updatedAt: string
	cancelledAt: string | null
	cancelReason: string | null
	financialStatus: string | null
	fulfillmentStatus: string
	requiresShipping: boolean
	edited: boolean
	note: string | null
	email: string | null
	phone: string | null
	statusPageUrl: string
	currencyCode: string
	subtotal: MoneyV2 | null
	totalPrice: MoneyV2
	totalTax: MoneyV2 | null
	totalShipping: MoneyV2
	totalDuties: MoneyV2 | null
	totalRefunded: MoneyV2
	totalTip: MoneyV2 | null
	totalDiscount: MoneyV2 | null
	shippingAddress: CustomerAddress | null
	billingAddress: CustomerAddress | null
	shippingLine: OrderShippingLine | null
	paymentInformation: OrderPaymentInformation | null
	transactions: OrderTransaction[]
	refunds: OrderRefund[]
	lineItems: {
		edges: { node: OrderDetailLineItem }[]
	}
	fulfillments: {
		edges: { node: OrderFulfillment }[]
	}
	discountApplications: {
		edges: { node: OrderDiscountApplication }[]
	}
	shippingDiscountAllocations: OrderDiscountAllocation[]
}

// ── API Responses ───────────────────────────────────────────────────────

export interface OrderDetailResponse {
	order: OrderDetail | null
}
