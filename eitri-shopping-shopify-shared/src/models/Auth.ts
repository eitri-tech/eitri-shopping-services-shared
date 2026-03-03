import { Customer } from './Customer'

export interface LoginParams {
	clientId: string
	callbackUri: string
	configUrl: string
	allowedDomains: string[]
}

export interface AccessTokenResponse {
	access_token: string
	expires_in: number
	id_token: string
	refresh_token: string
}

export type RefreshTokenResponse = Omit<AccessTokenResponse, 'id_token'>

export interface LoginResponse {
	success: boolean
	data?: AccessTokenResponse
	error?: string
	customer?: Customer
}

export interface RefreshResponse {
	success: boolean
	data?: RefreshTokenResponse
	error?: string
}
