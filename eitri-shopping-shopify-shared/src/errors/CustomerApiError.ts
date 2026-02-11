import { CustomerGraphQLError } from '../models/Customer'

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
