import Eitri from 'eitri-bifrost'
import {
	AccessTokenResponse,
	LoginParams,
	LoginResponse,
	RefreshResponse,
	RefreshTokenResponse
} from '../../models/Auth'
import Logger from '../_helpers/Logger'

const STORAGE_KEYS = {
	CODE_VERIFIER: 'SHOPIFY_CODE_VERIFIER',
	ACCESS_TOKEN: 'SHOPIFY_ACCESS_TOKEN',
	REFRESH_TOKEN: 'SHOPIFY_REFRESH_TOKEN',
	ID_TOKEN: 'SHOPIFY_ID_TOKEN'
}

export class AuthService {
	private static generateNonce(length: number): string {
		const array = new Uint8Array(length)
		crypto.getRandomValues(array)
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		return Array.from(array, byte => characters[byte % characters.length]).join('')
	}

	private static generateState(): string {
		return this.generateNonce(32)
	}

	private static base64UrlEncode(str: string): string {
		const base64 = btoa(str)
		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
	}

	private static convertBufferToString(hash: ArrayBuffer): string {
		const uintArray = new Uint8Array(hash)
		const numberArray = Array.from(uintArray)
		return String.fromCharCode(...numberArray)
	}

	private static generateRandomCode(): string {
		const array = new Uint8Array(32)
		crypto.getRandomValues(array)
		return String.fromCharCode.apply(null, Array.from(array))
	}

	private static async generateCodeVerifier(): Promise<string> {
		const rando = this.generateRandomCode()
		return this.base64UrlEncode(rando)
	}

	private static async generateCodeChallenge(codeVerifier: string): Promise<string> {
		const digestOp = await crypto.subtle.digest({ name: 'SHA-256' }, new TextEncoder().encode(codeVerifier))
		const hash = this.convertBufferToString(digestOp)
		return this.base64UrlEncode(hash)
	}

	private static async discoverEndpoints(configUrl: string) {
		const response = await Eitri.http.get(configUrl)
		return response.data
	}

	private static async exchangeToken(
		code: string,
		codeVerifier: string,
		tokenEndpoint: string,
		clientId: string,
		callbackUri: string
	): Promise<AccessTokenResponse> {
		const params = new URLSearchParams()
		params.append('grant_type', 'authorization_code')
		params.append('client_id', clientId)
		params.append('redirect_uri', callbackUri)
		params.append('code', code)
		params.append('code_verifier', codeVerifier)

		const url = `${tokenEndpoint}?${params.toString()}`

		console.log('url', url)

		const response = await Eitri.http.post(
			url,
			{},
			{
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}
		)

		return response.data
	}

	private static async exchangeRefreshToken(
		refreshToken: string,
		tokenEndpoint: string,
		clientId: string
	): Promise<RefreshTokenResponse> {
		const params = new URLSearchParams()
		params.append('grant_type', 'refresh_token')
		params.append('client_id', clientId)
		params.append('refresh_token', refreshToken)

		const url = `${tokenEndpoint}?${params.toString()}`

		Logger.log('[AuthService] Atualizando token de acesso:', url)

		const response = await Eitri.http.post(
			url,
			{},
			{
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			}
		)

		return response.data
	}

	/**
	 * Authenticates the customer via OAuth 2.0 with PKCE through the Shopify Customer Account API.
	 *
	 * Opens a web flow for the user to authenticate on Shopify and, upon return,
	 * exchanges the authorization code for access, refresh, and ID tokens.
	 *
	 * Required Remote Config variables (`providerInfo`):
	 * - `host` — Shopify store URL (e.g. `https://my-store.myshopify.com`)
	 * - `clientId` — Shopify Customer Account API Client ID
	 *
	 * @returns A `LoginResponse` object with `success: true` and tokens in `data`,
	 *          or `success: false` with the error description in `error`.
	 */
	static async login(): Promise<LoginResponse> {
		const remoteConfig = await Eitri.environment.getRemoteConfigs()

		const { host } = remoteConfig.providerInfo

		const clientId = '9526832b-e615-4d0c-99ce-31cb8351cc73'

		if (!host) {
			throw new Error('Missing required remote config variables')
		}

		if (!clientId) {
			throw new Error('Missing required remote config variable: clientId')
		}

		const fixedHost = host.replace('https://', '').replace('www.', '')

		const configUrl = `https://${fixedHost}/.well-known/openid-configuration`
		const callbackUri = `https://${fixedHost}/customer_authentication/callback`
		const allowedDomains = [`${fixedHost}`, 'shopify.com']

		try {
			const discoveryData = await this.discoverEndpoints(configUrl)
			const { authorization_endpoint, token_endpoint } = discoveryData

			const authorizeUrl = new URL(authorization_endpoint)
			authorizeUrl.searchParams.append('client_id', clientId)
			authorizeUrl.searchParams.append('response_type', 'code')
			authorizeUrl.searchParams.append('redirect_uri', callbackUri)
			authorizeUrl.searchParams.append('scope', 'openid email customer-account-api:full')
			authorizeUrl.searchParams.append('state', this.generateState())
			authorizeUrl.searchParams.append('nonce', this.generateNonce(32))

			const verifier = await this.generateCodeVerifier()
			const challenge = await this.generateCodeChallenge(verifier)
			await Eitri.storage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier)

			authorizeUrl.searchParams.append('code_challenge', challenge)
			authorizeUrl.searchParams.append('code_challenge_method', 'S256')

			console.log({
				startUrl: authorizeUrl.toString(),
				stopPattern: callbackUri,
				allowedDomains,
				maxNavigationLimit: 50,
				keepLoadingScreenUntilDomainChange: false
			})

			const webFlowRes = await Eitri.webFlow.start({
				startUrl: authorizeUrl.toString(),
				stopPattern: callbackUri,
				allowedDomains,
				maxNavigationLimit: 50,
				keepLoadingScreenUntilDomainChange: false
			})

			console.log('webFlowRes', webFlowRes)

			const callbackUrl = webFlowRes?.recordedNavigation?.[0]?.url
			if (!callbackUrl) {
				return { success: false, error: 'No callback URL received from webFlow' }
			}

			const code = new URL(callbackUrl).searchParams.get('code')
			if (!code) {
				return { success: false, error: 'No authorization code found in callback URL' }
			}

			const codeVerifier = await Eitri.storage.getItem(STORAGE_KEYS.CODE_VERIFIER)
			if (!codeVerifier) {
				return { success: false, error: 'No code verifier found' }
			}

			const tokenResponse = await this.exchangeToken(code, codeVerifier, token_endpoint, clientId, callbackUri)

			console.log('tokenResponse', tokenResponse)

			await Eitri.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token)
			await Eitri.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token)
			await Eitri.storage.setItem(STORAGE_KEYS.ID_TOKEN, tokenResponse.id_token)

			return {
				success: true,
				data: tokenResponse
			}
		} catch (e) {
			console.log('Login error:', e)
			throw e
		}
	}

	static async refresh(params: Pick<LoginParams, 'clientId' | 'configUrl'>): Promise<RefreshResponse> {
		const { clientId, configUrl } = params

		try {
			Logger.log('[AuthService] Atualizando token de acesso')
			const storedRefreshToken = await Eitri.storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
			if (!storedRefreshToken) {
				return { success: false, error: 'No refresh token found' }
			}

			const discoveryData = await this.discoverEndpoints(configUrl)
			const { token_endpoint } = discoveryData

			const tokenResponse = await this.exchangeRefreshToken(storedRefreshToken, token_endpoint, clientId)

			await Eitri.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token)
			await Eitri.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token)

			Logger.log('[AuthService] Token de acesso atualizado com sucesso')

			return { success: true, data: tokenResponse }
		} catch (e) {
			console.log('Refresh error:', e)
			return { success: false, error: String(e) }
		}
	}

	private static isAccessTokenExpired(token: string): boolean {
		try {
			const jwt = token.startsWith('shcat_') ? token.slice(6) : token
			const payload = JSON.parse(atob(jwt.split('.')[1]))
			const now = Math.floor(Date.now() / 1000)
			return payload.exp <= now + 60
		} catch {
			return true
		}
	}

	private static async getRemoteConfigParams(): Promise<{ clientId: string; configUrl: string } | null> {
		const remoteConfig = await Eitri.environment.getRemoteConfigs()
		const { host, clientId } = remoteConfig?.providerInfo || {}

		if (!host || !clientId) {
			return null
		}

		const fixedHost = host.replace('https://', '').replace('www.', '')
		return { clientId, configUrl: `https://${fixedHost}/.well-known/openid-configuration` }
	}

	static async getAccessToken(): Promise<string | null> {
		const token = await Eitri.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

		if (!token) {
			return null
		}

		if (!this.isAccessTokenExpired(token)) {
			return token
		}

		const params = await this.getRemoteConfigParams()
		if (!params) {
			return null
		}

		const result = await this.refresh(params)
		if (result.success) {
			return result.data.access_token
		}

		return null
	}

	static async getIdToken(): Promise<string | null> {
		return Eitri.storage.getItem(STORAGE_KEYS.ID_TOKEN)
	}

	static async isAuthenticated(): Promise<boolean> {
		const token = await this.getAccessToken()
		return !!token
	}

	static async logout(): Promise<void> {
		await Eitri.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
		await Eitri.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
		await Eitri.storage.removeItem(STORAGE_KEYS.ID_TOKEN)
		await Eitri.storage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
	}
}
