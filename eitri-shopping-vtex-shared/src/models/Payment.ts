export type GatewayCallbackData = {
	RedirectResponseCollection?: any[]
	paymentAuthorizationAppCollection?: {
		appName: string
		/** JSON serializado — o shape varia por conector/parceiro, por isso não é parseado aqui. */
		appPayload: string
	}[]
} & {
	[key: string]: any
}

export type PaymentResult = {
	orderId: string
	transactionId: string
	status: string
	gatewayCallbackResult?: GatewayCallbackData | null
} & {
	[key: string]: any
}
