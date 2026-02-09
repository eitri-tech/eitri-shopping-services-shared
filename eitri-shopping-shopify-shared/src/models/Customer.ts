export interface Customer {
	id: string
	firstName: string | null
	lastName: string | null
	email: string
	phone: string | null
	acceptsMarketing: boolean
	createdAt: string
	updatedAt: string
	displayName: string
	defaultAddress: CustomerAddress | null
	addresses: {
		edges: CustomerAddressEdge[]
	}
	orders: {
		edges: CustomerOrderEdge[]
	}
}

export interface CustomerAddress {
	id: string
	address1: string | null
	address2: string | null
	city: string | null
	province: string | null
	country: string | null
	zip: string | null
	phone: string | null
	firstName: string | null
	lastName: string | null
}

export interface CustomerAddressEdge {
	node: CustomerAddress
}

export interface CustomerOrder {
	id: string
	orderNumber: number
	processedAt: string
	financialStatus: string
	fulfillmentStatus: string
	totalPrice: {
		amount: string
		currencyCode: string
	}
}

export interface CustomerOrderEdge {
	node: CustomerOrder
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
