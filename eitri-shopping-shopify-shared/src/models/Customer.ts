export interface Customer {
	id: string
	firstName: string | null
	lastName: string | null
	emailAddress: CustomerEmailAddress | null
	phoneNumber: CustomerPhoneNumber | null
	creationDate: string
	displayName: string
	defaultAddress: CustomerAddress | null
	addresses: {
		edges: CustomerAddressEdge[]
	}
	orders: {
		edges: CustomerOrderEdge[]
	}
}

export interface CustomerEmailAddress {
	emailAddress: string
}

export interface CustomerPhoneNumber {
	phoneNumber: string
}

export interface CustomerAddress {
	id: string
	address1: string | null
	address2: string | null
	city: string | null
	province: string | null
	country: string | null
	zip: string | null
	phoneNumber: string | null
	firstName: string | null
	lastName: string | null
}

export interface CustomerAddressEdge {
	node: CustomerAddress
}

export interface MoneyV2 {
	amount: string
	currencyCode: string
}

export interface OrderLineItemImage {
	url: string
	altText: string | null
}

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

export interface CustomerAccessToken {
	accessToken: string
	expiresAt: string
}

export interface CustomerUserError {
	code: string
	field: string[] | null
	message: string
}

export interface CustomerAccessTokenCreateInput {
	email: string
	password: string
}

export interface CustomerCreateInput {
	email: string
	password: string
	firstName?: string
	lastName?: string
	phone?: string
	acceptsMarketing?: boolean
}

export interface CustomerUpdateInput {
	email?: string
	password?: string
	firstName?: string
	lastName?: string
	phone?: string
	acceptsMarketing?: boolean
}

export interface CustomerResetInput {
	resetToken: string
	password: string
}

export interface MailingAddressInput {
	address1?: string
	address2?: string
	city?: string
	province?: string
	country?: string
	zip?: string
	phone?: string
	firstName?: string
	lastName?: string
}

export interface CustomerAccessTokenCreateResponse {
	customerAccessTokenCreate: {
		customerAccessToken: CustomerAccessToken | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerCreateResponse {
	customerCreate: {
		customer: Customer | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerResponse {
	customer: Customer | null
}

export interface CustomerAccessTokenRenewResponse {
	customerAccessTokenRenew: {
		customerAccessToken: CustomerAccessToken | null
		userErrors: { field: string[]; message: string }[]
	}
}

export interface CustomerAccessTokenDeleteResponse {
	customerAccessTokenDelete: {
		deletedAccessToken: string | null
		deletedCustomerAccessTokenId: string | null
		userErrors: { field: string[]; message: string }[]
	}
}

export interface CustomerRecoverResponse {
	customerRecover: {
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerResetResponse {
	customerReset: {
		customer: Customer | null
		customerAccessToken: CustomerAccessToken | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerUpdateResponse {
	customerUpdate: {
		customer: Customer | null
		customerAccessToken: CustomerAccessToken | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerAddressCreateResponse {
	customerAddressCreate: {
		customerAddress: CustomerAddress | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerAddressUpdateResponse {
	customerAddressUpdate: {
		customerAddress: CustomerAddress | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerAddressDeleteResponse {
	customerAddressDelete: {
		deletedCustomerAddressId: string | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerDefaultAddressUpdateResponse {
	customerDefaultAddressUpdate: {
		customer: Customer | null
		customerUserErrors: CustomerUserError[]
	}
}

export interface CustomerGraphQLError {
	message: string
	path?: string[]
	extensions?: {
		code: string
		documentation?: string
		requiredAccess?: string
	}
}

export class CustomerApiError extends Error {
	status: number
	code: string
	graphqlErrors?: CustomerGraphQLError[]

	constructor(status: number, code: string, message: string, graphqlErrors?: CustomerGraphQLError[]) {
		super(message)
		this.name = 'CustomerApiError'
		this.status = status
		this.code = code
		this.graphqlErrors = graphqlErrors
	}
}
