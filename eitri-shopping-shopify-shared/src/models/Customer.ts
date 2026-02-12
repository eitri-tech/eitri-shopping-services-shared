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

export {
	OrderLineItemImage,
	OrderLineItem,
	CustomerOrder,
	CustomerOrderEdge,
	CustomerOrdersPageInfo,
	CustomerOrdersResponse
} from './Order'

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
	firstName?: string
	lastName?: string
}

export interface CustomerResetInput {
	resetToken: string
	password: string
}

export interface CustomerAddressInput {
	address1?: string
	address2?: string
	city?: string
	company?: string
	firstName?: string
	lastName?: string
	phoneNumber?: string
	territoryCode?: string
	zip?: string
	zoneCode?: string
}

/** @deprecated Use CustomerAddressInput instead */
export type MailingAddressInput = CustomerAddressInput

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
		userErrors: CustomerUserError[]
	}
}

export interface CustomerAddressCreateResponse {
	customerAddressCreate: {
		customerAddress: CustomerAddress | null
		userErrors: CustomerUserError[]
	}
}

export interface CustomerAddressUpdateResponse {
	customerAddressUpdate: {
		customerAddress: CustomerAddress | null
		userErrors: CustomerUserError[]
	}
}

export interface CustomerAddressDeleteResponse {
	customerAddressDelete: {
		deletedAddressId: string | null
		userErrors: CustomerUserError[]
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

