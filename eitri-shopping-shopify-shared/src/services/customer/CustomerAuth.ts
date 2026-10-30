import Eitri from 'eitri-bifrost'
import {
	AccessTokenResponse,
	LoginParams,
	LoginResponse,
	RefreshResponse,
	RefreshTokenResponse
} from '../../models/Auth'
import Logger from '../_helpers/Logger'
import RemoteConfig from '../RemoteConfig'
import { CustomerService } from './CustomerService'
import { sendLogError, sendDatadogWarningLog, sendDatadogInfoLog } from '../Datadog'

const STORAGE_KEYS = {
	CODE_VERIFIER: 'SHOPIFY_CODE_VERIFIER',
	ACCESS_TOKEN: 'SHOPIFY_ACCESS_TOKEN',
	REFRESH_TOKEN: 'SHOPIFY_REFRESH_TOKEN',
	ID_TOKEN: 'SHOPIFY_ID_TOKEN',
	OPENID_CONFIG: 'SHOPIFY_OPENID_CONFIG',
	OPENID_DISCOVERY: 'SHOPIFY_OPENID_DISCOVERY',
	LOGIN_CONFIG: 'SHOPIFY_LOGIN_CONFIG'
}

/** What the last successful login used; refresh and logout must talk to the same client and issuer. */
interface StoredLoginConfig {
	clientId: string
	configUrl: string
	callbackUrl: string
}

const isValidUrl = (value: unknown): value is string => {
	if (typeof value !== 'string' || !value) return false
	try {
		new URL(value)
		return true
	} catch {
		return false
	}
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

	private static configUrlFromHost(host: string): string {
		const fixedHost = host.replace('https://', '').replace('www.', '').replace(/\/+$/, '')
		return `https://${fixedHost}/.well-known/openid-configuration`
	}

	/**
	 * Resolves the OpenID configuration URL, in order: `options.openIdConfigUrl`, `options.host`,
	 * Remote Config `providerInfo.openIdConfigUrl`, and finally Remote Config `providerInfo.host`.
	 * The explicit URL exists for stores whose Customer Account domain differs from the storefront host.
	 */
	private static resolveConfigUrl(options?: { openIdConfigUrl?: string; host?: string }): string | null {
		if (options?.openIdConfigUrl) return options.openIdConfigUrl
		if (options?.host) return this.configUrlFromHost(options.host)
		const configured = RemoteConfig.getContent('providerInfo.openIdConfigUrl')
		if (configured) return configured
		const host = RemoteConfig.getContent('providerInfo.host')
		return host ? this.configUrlFromHost(host) : null
	}

	/**
	 * The cache lives under `OPENID_DISCOVERY`, keyed by URL: `OPENID_CONFIG` is read by older SDK versions
	 * running in other eitri-apps of the same super app, which expect the raw discovery document there.
	 */
	private static async discoverEndpoints(configUrl: string) {
		const cached = await Eitri.sharedStorage.getItem(STORAGE_KEYS.OPENID_DISCOVERY)
		if (cached) {
			try {
				const parsed = JSON.parse(cached)
				if (parsed?.configUrl === configUrl && parsed?.data?.token_endpoint) return parsed.data
			} catch {
				Logger.warn('[AuthService] Cache do openid-configuration inválido, buscando de novo')
			}
		}

		const response = await Eitri.http.get(configUrl)
		const data = response?.data
		if (!data?.token_endpoint || !data?.authorization_endpoint) {
			throw new Error(`openid-configuration inválido em ${configUrl}`)
		}
		await Eitri.sharedStorage.setItem(STORAGE_KEYS.OPENID_DISCOVERY, JSON.stringify({ configUrl, data }))
		return data
	}

	private static async getStoredLoginConfig(): Promise<StoredLoginConfig | null> {
		try {
			const parsed = JSON.parse((await Eitri.sharedStorage.getItem(STORAGE_KEYS.LOGIN_CONFIG)) || 'null')
			if (parsed?.clientId && parsed?.configUrl) return parsed
		} catch {
			Logger.warn('[AuthService] Configuração do login salva inválida')
		}
		return null
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

		Logger.log('[AuthService] Atualizando token de acesso:', tokenEndpoint)

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
	 * Notify to Push Notification API that the customer has logged in and give it the customer info and deviceId (Native automatically adds the deviceId).
	 */
	private static async notifyLogin() {
		const customer = await CustomerService.getCurrentCustomer()

		if (!customer) {
			Logger.error('No customer found to notify login')
			sendDatadogWarningLog({ message: 'notifyLogin não executado, customer não encontrado' }, 'AuthService.notifyLogin')
			return
		}

		const regex = /gid:\/\/shopify\/Customer\/(\d+)/

		const customerIdMatch = customer.id.match(regex)
		if (!customerIdMatch || customerIdMatch.length < 2) {
			Logger.error('Invalid customer ID format:', customer.id)
			sendDatadogWarningLog({ message: 'notifyLogin não executado, formato de customerId inválido', customerId: customer.id }, 'AuthService.notifyLogin')
			return
		}

		const customerId = customerIdMatch[1]

		const modules = await Eitri.modules()
		const notifyLogin = modules?.session?.notifyLogin
		if (!notifyLogin) return
		await notifyLogin({
			customerId: customerId,
			email: customer?.emailAddress?.emailAddress,
			provider: 'SHOPIFY'
		})

		return customer
	}

	/**
	 * Authenticates the customer via OAuth 2.0 with PKCE through the Shopify Customer Account API.
	 *
	 * Opens a web flow for the user to authenticate on Shopify and, upon return,
	 * exchanges the authorization code for access, refresh, and ID tokens.
	 *
	 * By default, we save the tokens in the device's storage.
	 *
	 * @param options - Optional overrides for Remote Config values (`providerInfo`).
	 *   If not provided, the values are read from Remote Config.
	 * @param options.host - Shopify store URL (e.g. `https://my-store.myshopify.com`).
	 * @param options.clientId - Shopify Customer Account API Client ID.
	 * @param options.callbackUrl - URL to redirect the user back to after authentication.
	 * @param options.openIdConfigUrl - Full URL of the store's `/.well-known/openid-configuration`. Falls back to
	 *   Remote Config `providerInfo.openIdConfigUrl`, then to one built from `host`.
	 *
	 * The client, configuration URL and callback used here are saved so `refresh` and `logout` use the same ones.
	 *
	 * @returns A `LoginResponse` object with `success: true` and tokens in `data`,
	 *          or `success: false` with the error description in `error`.
	 */
	static async login(options?: {
		host?: string
		callbackUrl?: string
		clientId?: string
		openIdConfigUrl?: string
		allowedDomains?: string[]
	}): Promise<LoginResponse> {
		const providerInfo = RemoteConfig.getRemoteConfig()?.providerInfo ?? {}

		const clientId = options?.clientId || providerInfo.clientId
		const host = options?.host || providerInfo.host
		const callbackUrl = options?.callbackUrl || providerInfo.callbackUrl
		const configUrl = this.resolveConfigUrl(options)

		if (!configUrl) {
			throw new Error('Missing required remote config variables')
		}

		if (!clientId) {
			throw new Error('Missing required remote config variable: clientId')
		}

		if (!callbackUrl) {
			throw new Error('Missing required remote config variable: callbackUrl')
		}

		try {
			const discoveryData = await this.discoverEndpoints(configUrl)
			const { authorization_endpoint, token_endpoint } = discoveryData

			const authorizeUrl = new URL(authorization_endpoint)

			const allowedDomains = [
				...(host ? [host] : []),
				'shopify.com',
				authorizeUrl.hostname,
				'facebook.com',
				'm.facebook.com',
				'lm.facebook.com',
				'accounts.google.com',
				'accounts.google.com.br',
				'accounts.youtube.com',
				'accounts.youtube.com.br',
				// For callback URL with Headless App on Shopify
				'callback',
				...(options?.allowedDomains ?? [])
			]

			Logger.log('Allowed domains for web flow:', allowedDomains)

			authorizeUrl.searchParams.append('client_id', clientId)
			authorizeUrl.searchParams.append('response_type', 'code')
			authorizeUrl.searchParams.append('redirect_uri', callbackUrl)
			authorizeUrl.searchParams.append('scope', 'openid email customer-account-api:full')
			authorizeUrl.searchParams.append('state', this.generateState())
			authorizeUrl.searchParams.append('nonce', this.generateNonce(32))

			const verifier = await this.generateCodeVerifier()
			const challenge = await this.generateCodeChallenge(verifier)
			await Eitri.sharedStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier)

			authorizeUrl.searchParams.append('code_challenge', challenge)
			authorizeUrl.searchParams.append('code_challenge_method', 'S256')

			console.log('Authorization URL:', authorizeUrl.toString())

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

			const codeVerifier = await Eitri.sharedStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)
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

			await Eitri.sharedStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token)
			await Eitri.sharedStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token)
			await Eitri.sharedStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokenResponse.id_token)
			const loginConfig: StoredLoginConfig = { clientId, configUrl, callbackUrl }
			await Eitri.sharedStorage.setItem(STORAGE_KEYS.LOGIN_CONFIG, JSON.stringify(loginConfig))

			const customer = await this.notifyLogin()

			sendDatadogInfoLog({ message: 'Login realizado com sucesso', email: customer?.emailAddress?.emailAddress }, 'AuthService.login')

			return {
				success: true,
				data: tokenResponse,
				customer: customer || undefined
			}
		} catch (e) {
			Logger.error('Login error:', e)
			console.error(e)
			sendLogError(e, 'AuthService.login')
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
			const storedRefreshToken = await Eitri.sharedStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
			if (!storedRefreshToken) {
				return { success: false, error: 'No refresh token found' }
			}

			const discoveryData = await this.discoverEndpoints(configUrl)
			const { token_endpoint } = discoveryData

			const tokenResponse = await this.exchangeRefreshToken(storedRefreshToken, token_endpoint, clientId)
			if (!tokenResponse?.access_token) {
				throw new Error('Resposta do refresh sem access_token')
			}

			await Eitri.sharedStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenResponse.access_token)
			if (tokenResponse.refresh_token) {
				await Eitri.sharedStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenResponse.refresh_token)
			}

			Logger.log('[AuthService] Token de acesso atualizado com sucesso')

			sendDatadogInfoLog({ message: 'Refresh token executado com sucesso' }, 'AuthService.refresh')

			return { success: true, data: tokenResponse }
		} catch (e) {
			Logger.error('[AuthService] Falha ao atualizar o token da Shopify', e)
			sendLogError(e, 'AuthService.refresh')
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

	/** Logins made before `LOGIN_CONFIG` existed fall back to Remote Config. */
	private static async getRefreshParams(): Promise<{ clientId: string; configUrl: string } | null> {
		const stored = await this.getStoredLoginConfig()
		if (stored) return { clientId: stored.clientId, configUrl: stored.configUrl }

		const clientId = RemoteConfig.getContent('providerInfo.clientId')
		const configUrl = this.resolveConfigUrl()
		return clientId && configUrl ? { clientId, configUrl } : null
	}

	private static refreshing: Promise<string | null> | null = null

	/** Re-reads the token first: another eitri-app may have refreshed it while this one waited. */
	private static async refreshAccessToken(): Promise<string | null> {
		const current = await Eitri.sharedStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
		if (current && !this.isAccessTokenExpired(current)) return current

		const params = await this.getRefreshParams()
		if (!params) return null

		const result = await this.refresh(params)
		return result.success ? result.data.access_token : null
	}

	/**
	 * Retrieves a valid Shopify Customer Account API access token.
	 *
	 * Returns the stored token if it is still valid. If the token is expired,
	 * it automatically attempts to refresh it using the stored refresh token. Concurrent callers share the
	 * same refresh: with refresh-token rotation, parallel refreshes would race and could store a revoked token.
	 *
	 * @returns The access token string, or `null` if no token is stored or the refresh fails.
	 */
	static async getAccessToken(): Promise<string | null> {
		const token = await Eitri.sharedStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

		if (!token) {
			return null
		}

		if (!this.isAccessTokenExpired(token)) {
			return token
		}

		if (!this.refreshing) {
			this.refreshing = this.refreshAccessToken().finally(() => {
				this.refreshing = null
			})
		}
		return this.refreshing
	}

	/**
	 * Retrieves the stored OpenID Connect ID token.
	 *
	 * @returns The ID token string, or `null` if not stored.
	 */
	static async getIdToken(): Promise<string | null> {
		return Eitri.sharedStorage.getItem(STORAGE_KEYS.ID_TOKEN)
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
	 * Ends the Shopify web session (OIDC end_session) inside the webFlow cookie-jar.
	 *
	 * auth.logout() only clears local tokens; the Shopify session cookie persists in the
	 * webFlow cookie-jar, so a subsequent /oauth/authorize returns a code silently (no login
	 * prompt). Opening the end_session_endpoint inside Eitri.webFlow (same cookie-jar) clears it.
	 *
	 * The Shopify logout endpoint answers 200 without a redirect, so the web flow never closes on
	 * its own — onLoadJsScript forces a redirect to a sentinel URL that matches stopPattern. The
	 * flow MUST close cleanly: leaving it hanging corrupts the native webview and breaks the next login.
	 */
	private static async endWebSession(): Promise<void> {
		const idToken = await this.getIdToken()
		if (!idToken) throw new Error('no.id.token')

		const stored = await this.getStoredLoginConfig()
		const configUrl = stored?.configUrl ?? this.resolveConfigUrl()
		if (!configUrl) throw new Error('no.openid.config.url')

		const { end_session_endpoint } = await this.discoverEndpoints(configUrl)
		if (!end_session_endpoint) throw new Error('no.end_session_endpoint')

		const shopId = end_session_endpoint.match(/authentication\/(\d+)/)?.[1]
		const logoutRedirectUri =
			[stored?.callbackUrl, RemoteConfig.getContent('providerInfo.callbackUrl')].find(isValidUrl) ??
			`shop.${shopId}.app://callback`

		await Eitri.webFlow.start({
			startUrl: `${end_session_endpoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${logoutRedirectUri}`,
			stopPattern: 'eitri-logout-done|callback',
			allowedDomains: ['shopify.com', 'www.shopify.com', 'callback', new URL(logoutRedirectUri).hostname],
			maxNavigationLimit: 5,
			onLoadJsScript: `window.location.href = 'https://www.shopify.com/eitri-logout-done';`
		})
	}

	/**
	 * Logs the customer out: ends the Shopify web session and clears all stored tokens/config.
	 */
	static async logout(): Promise<void> {
		try {
			await this.endWebSession()
		} catch (error) {
			sendLogError(error, 'AuthService.logout')
			throw error
		}
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.ID_TOKEN)
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.OPENID_CONFIG)
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.OPENID_DISCOVERY)
		await Eitri.sharedStorage.removeItem(STORAGE_KEYS.LOGIN_CONFIG)
		await Eitri.sharedStorage.removeItem('SHOPIFY_CUSTOMER_API_URL')
	}

	static getStorageKeys() {
		return STORAGE_KEYS
	}
}
