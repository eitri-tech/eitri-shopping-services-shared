export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'EXPIRED' | 'MISSING'

export type SubscriptionPeriodicity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type SubscriptionAddressType = 'residential' | 'pickup'

export type SubscriptionPlan = {
	id: string
	frequency: {
		periodicity: SubscriptionPeriodicity
		interval: number
	}
	validity?: {
		begin?: string | null
		end?: string | null
	}
	purchaseDay?: string | null
}

export type SubscriptionAttachment = {
	name: string
	content: Record<string, any>
}

export type SubscriptionItem = {
	id: string
	skuId: string
	quantity: number
	isSkipped: boolean
	status: SubscriptionStatus
	originalOrderId?: string
	cycleCount: number
	priceAtSubscriptionDate?: number
	manualPrice?: number | null
	attachments: SubscriptionAttachment[] | null
}

export type SubscriptionPaymentMethod = {
	paymentAccountId: string
	paymentSystem: string
	installments?: number | null
	paymentSystemName?: string | null
	paymentSystemGroup?: string | null
}

export type SubscriptionPurchaseSettings = {
	paymentMethod: SubscriptionPaymentMethod
	currencyCode?: string
	selectedSla?: string
	salesChannel: string
	seller?: string
}

export type SubscriptionShippingAddress = {
	addressId: string
	addressType: SubscriptionAddressType
}

export type Subscription = {
	id: string
	customerId: string
	customerEmail: string
	title: string | null
	status: SubscriptionStatus
	isSkipped: boolean
	nextPurchaseDate: string
	lastPurchaseDate: string | null
	plan: SubscriptionPlan
	shippingAddress: SubscriptionShippingAddress
	purchaseSettings: SubscriptionPurchaseSettings
	cycleCount: number
	createdAt: string
	lastUpdate: string | null
	items: SubscriptionItem[]
	lastCycleId: string | null
	customData: Record<string, any> | null
} & {
	[key: string]: any
}

export type SubscriptionListFilters = {
	status?: SubscriptionStatus
	addressId?: string
	paymentId?: string
	planId?: string
	nextPurchaseDate?: string
	originalOrderId?: string
	page?: number
	size?: number
}

export type SubscriptionItemRequest = {
	skuId: string
	quantity: number
	manualPrice?: number | null
	attachments?: SubscriptionAttachment[]
}

export type SubscriptionItemUpdateRequest = {
	status?: SubscriptionStatus | null
	isSkipped?: boolean | null
	quantity?: number
	manualPrice?: number
}

export type SubscriptionCreateRequest = {
	customerEmail?: string
	title?: string | null
	status?: SubscriptionStatus | null
	nextPurchaseDate?: string
	catalogAttachment?: string | null
	plan: SubscriptionPlan
	shippingAddress: SubscriptionShippingAddress
	purchaseSettings: SubscriptionPurchaseSettings
	items: SubscriptionItemRequest[]
}

export type SubscriptionUpdateRequest = {
	customerEmail?: string
	title?: string | null
	status?: SubscriptionStatus | null
	nextPurchaseDate?: string
	isSkipped?: boolean
	plan?: SubscriptionPlan
	shippingAddress?: SubscriptionShippingAddress
	purchaseSettings?: SubscriptionPurchaseSettings
}

export type SubscriptionCycleStatus =
	| 'TRIGGERED'
	| 'IN_PROCESS'
	| 'FAILURE'
	| 'SUCCESS'
	| 'EXPIRED'
	| 'ORDER_ERROR'
	| 'PAYMENT_ERROR'
	| 'SKIPED'
	| 'SUCCESS_WITH_NO_ORDER'
	| 'SUCCESS_WITH_PARTIAL_ORDER'
	| 'RE_TRIGGERED'
	| 'SCHEDULE_UPDATED'

export type SubscriptionSimulationItem = {
	id: string | null
	quantity: number
	unitPrice: number | null
	status: string
	price: number | null
	sellingPrice: number
	manualPrice: number | null
}

export type SubscriptionCycle = {
	id: string
	subscriptionId: string
	workflowId: string
	status: SubscriptionCycleStatus
	customerEmail: string
	customerId: string
	date: string
	lastUpdate: string
	cycleCount: number
	isInRetry: boolean
	message: string | null
	friendlyMessage: string | null
	plan: SubscriptionPlan
	orderInfo?: {
		orderId: string
		orderGroup: string
		paymentURL: string | null
		value: number
	}
	context?: {
		items:
			| {
					subscriptionItemId: string | null
					skuId: string | null
					quantity: number | null
					status: SubscriptionStatus | null
					isSkipped: boolean | null
					cycleCount: number | null
			  }[]
			| null
		paymentSystem: string | null
		paymentSystemName: string | null
		paymentSystemGroup: string | null
		paymentAccountId: string | null
		addressId: string | null
		addressType: string | null
		catalogAttachment: string | null
	}
	simulationItems: SubscriptionSimulationItem[] | null
} & {
	[key: string]: any
}

export type SubscriptionCycleListFilters = {
	beginDate?: string
	endDate?: string
	subscriptionId?: string
	customerEmail?: string
	status?: SubscriptionCycleStatus
	page?: number
	size?: number
}

export type SubscriptionSimulation = {
	simulation: {
		items: any[]
		logisticsInfo: any[]
		paymentData: Record<string, any> | null
		country: string | null
		postalCode: string | null
		messages: { code: string | null; status: string | null; text: string | null }[] | null
		selectableGifts: any[] | null
		totals: { id: 'Items' | 'Discounts' | 'Shipping' | 'Tax'; name: string; valueAsInt: number }[]
		totalsBySimulationItems: SubscriptionSimulationItem[]
	}
	shippingEstimate: {
		name: string
		estimate: string
		estimateDeliveryDate: string
		nextPurchaseDate: string
		matched: boolean
	}
	totalsBySimulationItems: SubscriptionSimulationItem[]
	totals: { id: 'Items' | 'Discounts' | 'Shipping' | 'Tax'; value: number }[]
} & {
	[key: string]: any
}

export type SubscriptionConversationParticipant = {
	conversationRelatedTo: string
	conversationSubject: string
	emailAlias: string
	aliasMaskType: string
	email: string
	name: string
	role: string | null
}

export type SubscriptionConversationMessage = {
	id: string
	from: SubscriptionConversationParticipant
	to: SubscriptionConversationParticipant[]
	subject: string
	firstWords: string
	body: string
	hasAttachment: boolean
	attachmentNames: string[] | null
	date: string
}
