export type NexusErrorCode =
	| 'NO_APP_ID'
	| 'NO_SESSION'
	| 'UNAUTHORIZED'
	| 'INVALID_PAYLOAD'
	| 'INVALID_COLLECTION'
	| 'INVALID_FILTER'
	| 'NOT_FOUND'
	| 'LIMIT_REACHED'
	| 'UNSUPPORTED_PLATFORM'
	| 'NETWORK_ERROR'

export class NexusError extends Error {
	code: NexusErrorCode
	status?: number

	constructor(code: NexusErrorCode, message: string, status?: number) {
		super(message)
		this.name = 'NexusError'
		this.code = code
		this.status = status
	}
}
