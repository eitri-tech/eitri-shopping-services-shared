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
	ID_TOKEN: 'SHOPIFY_ID_TOKEN',
	OPENID_CONFIG: 'SHOPIFY_OPENID_CONFIG'
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
		const cached = await Eitri.storage.getItem(STORAGE_KEYS.OPENID_CONFIG)
		if (cached) {
			return JSON.parse(cached)
		}

		const response = await Eitri.http.get(configUrl)
		await Eitri.storage.setItem(STORAGE_KEYS.OPENID_CONFIG, JSON.stringify(response.data))
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

	static buildDomainRegex(domain: string) {
		if (typeof domain !== 'string' || !domain.trim()) {
			throw new Error('Invalid domain')
		}

		// Remove protocolo se vier junto
		domain = domain.replace(/^https?:\/\//, '').trim()

		// Remove path se vier junto
		domain = domain.split('/')[0]

		// Escapa caracteres especiais para regex
		const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

		// Permite subdomínios + domínio raiz
		return `^(?:[a-zA-Z0-9-]+\\.)*${escaped}$`
	}

	/**
	 * Authenticates the customer via OAuth 2.0 with PKCE through the Shopify Customer Account API.
	 *
	 * Opens a web flow for the user to authenticate on Shopify and, upon return,
	 * exchanges the authorization code for access, refresh, and ID tokens.
	 *
	 * By default, we save the tokens in the device's storage.
	 *
	 * Required Remote Config variables (`providerInfo`):
	 * - `host` — Shopify store URL (e.g. `https://my-store.myshopify.com`)
	 * - `clientId` — Shopify Customer Account API Client ID
	 * - `callbackUrl` — URL to redirect the user back to after authentication
	 *
	 * @returns A `LoginResponse` object with `success: true` and tokens in `data`,
	 *          or `success: false` with the error description in `error`.
	 */
	static async login(): Promise<LoginResponse> {
		const remoteConfig = await Eitri.environment.getRemoteConfigs()

		const { host, clientId, callbackUrl } = remoteConfig.providerInfo

		if (!host) {
			throw new Error('Missing required remote config variables')
		}

		if (!clientId) {
			throw new Error('Missing required remote config variable: clientId')
		}

		if (!callbackUrl) {
			throw new Error('Missing required remote config variable: callbackUrl')
		}

		const fixedHost = host.replace('https://', '').replace('www.', '')

		const configUrl = `https://${fixedHost}/.well-known/openid-configuration`

		try {
			const discoveryData = await this.discoverEndpoints(configUrl)
			const { authorization_endpoint, token_endpoint } = discoveryData

			const authorizeUrl = new URL(authorization_endpoint)

			const allowedDomains = [
				host,
				'shopify.com',
				authorizeUrl.hostname,
				'facebook.com',
				'm.facebook.com',
				'lm.facebook.com',
				'accounts.google.com',
				'accounts.google.com.br',
				'accounts.youtube.com',
				'accounts.youtube.com.br'
			]

			authorizeUrl.searchParams.append('client_id', clientId)
			authorizeUrl.searchParams.append('response_type', 'code')
			authorizeUrl.searchParams.append('redirect_uri', callbackUrl)
			authorizeUrl.searchParams.append('scope', 'openid email customer-account-api:full')
			authorizeUrl.searchParams.append('state', this.generateState())
			authorizeUrl.searchParams.append('nonce', this.generateNonce(32))

			const verifier = await this.generateCodeVerifier()
			const challenge = await this.generateCodeChallenge(verifier)
			await Eitri.storage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier)

			authorizeUrl.searchParams.append('code_challenge', challenge)
			authorizeUrl.searchParams.append('code_challenge_method', 'S256')

			const webFlowRes = await Eitri.webFlow.start({
				startUrl: authorizeUrl.toString(),
				stopPattern: callbackUrl,
				maxNavigationLimit: 50,
				keepLoadingScreenUntilDomainChange: false,
				allowedDomains
			})

			Logger.log('webFlowRes', webFlowRes)

			const webFlowResCallbackUrl = webFlowRes?.recordedNavigation?.[0]?.url
			if (!webFlowResCallbackUrl) {
				return { success: false, error: 'No callback URL received from webFlow' }
			}

			const code = new URL(webFlowResCallbackUrl).searchParams.get('code')
			if (!code) {
				return { success: false, error: 'No authorization code found in callback URL' }
			}

			const codeVerifier = await Eitri.storage.getItem(STORAGE_KEYS.CODE_VERIFIER)
			if (!codeVerifier) {
				return { success: false, error: 'No code verifier found' }
			}

			const tokenResponse = await this.exchangeToken(
				code,
				codeVerifier,
				token_endpoint,
				clientId,
				webFlowResCallbackUrl
			)

			Logger.log('Token generated with success')

			await Eitri.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token)
			await Eitri.storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token)
			await Eitri.storage.setItem(STORAGE_KEYS.ID_TOKEN, tokenResponse.id_token)

			return {
				success: true,
				data: tokenResponse
			}
		} catch (e) {
			Logger.error('Login error:', e)
			console.error(e)
			throw e
		}
	}

	/**
	 * Refreshes the customer's access token using the stored refresh token.
	 *
	 * Fetches the token endpoint from the OpenID configuration and exchanges
	 * the refresh token for a new access/refresh token pair.
	 *
	 * @param params - Object containing `clientId` and `configUrl` from remote config.
	 * @returns A `RefreshResponse` with `success: true` and new tokens in `data`,
	 *          or `success: false` with the error description in `error`.
	 */
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
			Logger.error('Refresh error:', e)
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

	/**
	 * Retrieves a valid Shopify Customer Account API access token.
	 *
	 * Returns the stored token if it is still valid. If the token is expired,
	 * it automatically attempts to refresh it using the stored refresh token.
	 *
	 * @returns The access token string, or `null` if no token is stored or the refresh fails.
	 */
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

	/**
	 * Retrieves the stored OpenID Connect ID token.
	 *
	 * @returns The ID token string, or `null` if not stored.
	 */
	static async getIdToken(): Promise<string | null> {
		return Eitri.storage.getItem(STORAGE_KEYS.ID_TOKEN)
	}

	/**
	 * Checks whether the customer is currently authenticated.
	 *
	 * Verifies that a valid (non-expired) access token exists, refreshing it if needed.
	 *
	 * @returns `true` if a valid access token is available, `false` otherwise.
	 */
	static async isAuthenticated(): Promise<boolean> {
		const token = await this.getAccessToken()
		return !!token
	}

	/**
	 * Logs the customer out by clearing all stored tokens and cached configuration.
	 */
	static async logout(): Promise<void> {
		await Eitri.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
		await Eitri.storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
		await Eitri.storage.removeItem(STORAGE_KEYS.ID_TOKEN)
		await Eitri.storage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
		await Eitri.storage.removeItem(STORAGE_KEYS.OPENID_CONFIG)
		await Eitri.storage.removeItem('SHOPIFY_CUSTOMER_API_URL')
	}

	static  getStorageKeys() {
		return STORAGE_KEYS
	}
}
