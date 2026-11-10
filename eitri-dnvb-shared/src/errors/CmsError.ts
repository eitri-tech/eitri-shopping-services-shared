export type CmsErrorCode = 'NO_APP_ID' | 'NOT_FOUND' | 'NETWORK_ERROR' | 'INVALID_PAYLOAD'

export class CmsError extends Error {
	code: CmsErrorCode
	status?: number

	constructor(code: CmsErrorCode, message: string, status?: number) {
		super(message)
		this.name = 'CmsError'
		this.code = code
		this.status = status
	}
}
