import Eitri from 'eitri-bifrost'
import Vtex from '../../Vtex'
import StorageService from '../../StorageService'
import VtexCaller from '../_helpers/_vtexCaller'
import App from '../../App'
import extractCookies from '../_helpers/extractCookies'

export default class VtexCustomerService {
	static STORAGE_USER_TOKEN_KEY = 'user_token_key'
	static STORAGE_USER_DATA = 'user_data'
	static TOKEN_EXPIRATION_TIME_SEC = 86200

	static CHANNEL_UTM_PARAMS_KEY = 'ChanellUTMParams'
	static STORAGE_UTM_PARAMS_KEY = 'utm_params_key'
	static TIME_EXPIRES_UTM_PARAMS_IN_DAYS = 30

	static async _startLogin(email) {
		const { account } = Vtex.configs

		const startLoginRes = await VtexCaller.post(
			`api/vtexid/pub/authentication/startlogin`,
			{
				accountName: account,
				scope: account,
				user: email
			},
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'accept': '*/*'
				}
			}
		)

		const vssCookie = extractCookies(startLoginRes, '_vss')

		if (vssCookie) {
			VtexCustomerService.cookieValue = vssCookie
		}
	}

	static async loginWithEmailAndPassword(email, password) {
		await VtexCustomerService._startLogin(email)

		const loginRes = await VtexCaller.post(
			`api/vtexid/pub/authentication/classic/validate`,
			{
				password: password,
				login: email
			},
			{
				headers: {
					'Content-Type': 'multipart/form-data',
					'accept': '*/*',
					'Cookie': `_vss=${VtexCustomerService.cookieValue}`
				}
			}
		)

		const refreshToken = extractCookies(loginRes, 'vid_rt')

		const { data } = loginRes
		const { authCookie } = data
		const { authStatus } = data

		await VtexCustomerService._processPostLogin(authCookie.Value, refreshToken)

		// await VtexCustomerService.setCustomerToken(authCookie.Value, refreshToken)
		// VtexCustomerService.setCustomerData('email', email)
		// VtexCustomerService.notifyLoginToExposedApis()

		return authStatus
	}

	static async sendAccessKeyByEmail(email) {
		await VtexCustomerService._startLogin(email)

		const loginRes = await VtexCaller.post(
			`api/vtexid/pub/authentication/accesskey/send`,
			{
				email: email,
				locale: 'pt-BR'
			},
			{
				headers: {
					'Content-Type': 'multipart/form-data',
					'accept': '*/*',
					'Cookie': `_vss=${VtexCustomerService.cookieValue}`
				}
			}
		)

		const { status } = loginRes

		return status
	}

	static async loginWithEmailAndAccessKey(email, accessKey) {
		const loginRes = await VtexCaller.post(
			`api/vtexid/pub/authentication/accesskey/validate`,
			{
				accessKey: accessKey,
				login: email
			},
			{
				headers: {
					'Content-Type': 'multipart/form-data',
					'accept': '*/*',
					'Cookie': `_vss=${VtexCustomerService.cookieValue}`
				}
			}
		)

		const refreshToken = extractCookies(loginRes, 'vid_rt')

		const { data } = loginRes
		const { authCookie } = data
		const { authStatus } = data

		await VtexCustomerService._processPostLogin(authCookie.Value, refreshToken)

		return authStatus
	}

	static async loginWithGoogle() {
		let webFlowRes = await Eitri.webFlow.start({
			startUrl: `${Vtex.configs.host}/login?returnUrl=/account`,
			stopPattern: `${Vtex.configs.host}/api/vtexid/oauth/finish`,
			allowedDomains: ['*'],
			onLoadJsScript: `
			          const interval = setInterval(() => {
			              const googleBtn = document.querySelector(
			                  ".vtex-login-2-x-googleOptionBtn button"
			              );

			              if (googleBtn) {
			                  clearInterval(interval);
			                  console.log("Google button found, clicking...");
			                  googleBtn.click();
			              }
			          }, 500);

			          setTimeout(() => {
			              clearInterval(interval);
			              console.log("Timeout, google button not found");
			          }, 10000);
			          `,
			maxNavigationLimit: 20
		})

		const finishNavigation = webFlowRes?.recordedNavigation?.find(n => n.url.includes(`api/vtexid/oauth/finish`))

		if (finishNavigation) {
			const params = new URL(finishNavigation.url).searchParams
			const authCookieValue = params.get('authCookieValue')

			await VtexCustomerService._processPostLogin(authCookieValue, '')
		} else {
			throw new Error('Google login failed')
		}
	}

	static async notifyLoginToExposedApis(customerId) {
		try {
			if (!customerId) {
				console.log('notifyLoginToExposedApis error', 'customerId not found')
				return
			}
			console.log('notificando login', customerId)
			Eitri.exposedApis.session.notifyLogin({ customerId })
		} catch (e) {
			console.log('notifyLoginToExposedApis error', e)
		}
	}

	static async notifyLogoutToExposedApis() {
		try {
			console.log('notificando logout')
			Eitri.exposedApis.session.notifyLogout()
		} catch (e) {
			console.log('notifyLogoutToExposedApis error', e)
		}
	}

	static async setPassword(email, accessKey, newPassword) {
		const loginRes = await VtexCaller.post(
			`api/vtexid/pub/authentication/classic/setpassword?expireSessions=true`,
			{
				accessKey: accessKey,
				login: email,
				newPassword: newPassword
			},
			{
				headers: {
					'Content-Type': 'multipart/form-data',
					'accept': '*/*',
					'Cookie': VtexCustomerService.cookieValue
				}
			}
		)

		const { data } = loginRes
		const { authCookie } = data
		const { authStatus } = data

		await VtexCustomerService.setCustomerToken(authCookie.Value)
		VtexCustomerService.setCustomerData('email', email)

		return authStatus
	}

	static async listOrders(page, includeProfileLastPurchases = true) {
		const orders = await VtexCaller.get(
			`api/oms/user/orders/?page=${page || 1}&includeProfileLastPurchases=${includeProfileLastPurchases}`
		)
		return orders.data
	}

	static async getOrderById(orderId) {
		const orders = await VtexCaller.get(`api/oms/user/orders/${orderId}`)
		return orders.data
	}

	static async logout() {
		VtexCustomerService.notifyLogoutToExposedApis()
		StorageService.removeItem(VtexCustomerService.STORAGE_USER_TOKEN_KEY)
		StorageService.removeItem(VtexCustomerService.STORAGE_USER_DATA)
		return
	}

	static async getCustomerToken() {
		const savedToken = await StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_TOKEN_KEY)
		if (!savedToken) {
			return null
		}
		if (
			savedToken.creationTimeStamp + VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC <
			Math.floor(Date.now() / 1000)
		) {
			return null
		}
		return savedToken.token
	}

	static async getStorageCustomerToken() {
		return await StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_TOKEN_KEY)
	}

	static async setCustomerToken(token, refreshToken) {
		const creationTimeStamp = Math.floor(Date.now() / 1000)
		return StorageService.setStorageJSON(VtexCustomerService.STORAGE_USER_TOKEN_KEY, {
			token,
			refreshToken,
			creationTimeStamp
		})
	}

	static async isLoggedIn() {
		const savedToken = await StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_TOKEN_KEY)
		if (!savedToken) {
			return false
		}
		return (
			savedToken.creationTimeStamp + VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC >=
			Math.floor(Date.now() / 1000)
		)
	}

	static async cancelOrder(orderId, payload = {}) {
		const response = await VtexCaller.post(`api/checkout/pub/orders/${orderId}/user-cancel-request`, payload)
		return response.data
	}

	static async setCustomerData(key, value) {
		const userData = await StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_DATA)
		if (!userData) {
			return StorageService.setStorageJSON(VtexCustomerService.STORAGE_USER_DATA, { [key]: value })
		} else {
			const newUserData = { ...userData, [key]: value }
			return StorageService.setStorageJSON(VtexCustomerService.STORAGE_USER_DATA, newUserData)
		}
	}

	static async getCustomerData(key) {
		const userData = await StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_DATA)
		if (!userData || !userData[key]) {
			return null
		}

		return userData[key]
	}

	static async retrieveCustomerData() {
		return StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_DATA)
	}

	static async clearCustomerData() {
		return StorageService.removeItem(VtexCustomerService.STORAGE_USER_DATA)
	}

	static async getCustomerProfile() {
		const token = await VtexCustomerService.getCustomerToken()

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query: 'query Profile @context(scope: "private", sender: "vtex.my-account@1.29.0") { profile { userId cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate } }'
		}

		const result = await VtexCaller.post(
			`_v/private/graphql/v1`,
			body,
			{
				headers: {
					'Content-Type': 'application/json',
					'accept': '*/*'
				}
			},
			Vtex.configs.host
		)

		return result?.data
	}

	static async updateCustomerProfile(profile) {
		const token = await VtexCustomerService.getCustomerToken()

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query: 'mutation UpdateProfile($profile: ProfileInput) @context(sender: "vtex.my-account@1.29.0") @runtimeMeta(hash: "ed3962923c6d433ceef1bd1156882fca341d263600e70595af2674fbed0ea549") { updateProfile(fields: $profile) { cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate __typename } }',
			variables: {
				profile: profile
			}
		}

		const result = await VtexCaller.post(
			`_v/private/graphql/v1`,
			body,
			{
				headers: {
					'Content-Type': 'application/json',
					'accept': '*/*'
				}
			},
			Vtex.configs.host
		)

		return result?.data
	}

	static async newsletterSubscribe(email) {}

	/**
	 * Extrai parâmetros UTM de uma string de query ou de um objeto e salva no Storage.
	 *
	 * @param {string|Object} input - A string de query (ex: "?utm_source=google") ou um objeto contendo parâmetros.
	 * @returns {Object | null} Um objeto contendo os parâmetros UTM extraídos serão salvo no Storage.
	 * @property {string} saveAt - data de salvamento no formato ISO 8601. Ex: 2025-03-31T10:21:54.164Z
	 * @property {string} utm_campaignid - O ID da campanha.
	 * @property {string} utm_campaign - O nome da campanha.
	 * @property {string} utm_source - A fonte do tráfego.
	 * @property {string} utm_medium - O meio da campanha.
	 * @property {string} utm_term - O termo da campanha.
	 * @property {string} utm_content - O conteúdo da campanha.
	 */
	static async saveUtmParams(queryParams) {
		if (!queryParams) return

		if (typeof queryParams === 'string') {
			const queryParamsObj = queryParams.split('&').reduce((acc, param) => {
				const [key, value] = param.split('=')
				acc[key] = value
				return acc
			}, {})
			return VtexCustomerService.saveUtmParams(queryParamsObj)
		}

		if (typeof queryParams === 'object') {
			const utmParams = {}

			try {
				for (const key of Object.keys(queryParams)) {
					const normalizedKey = key.replace(/[_-]/g, '').toLowerCase()

					if (normalizedKey.startsWith('utm')) {
						const newKey = 'utm_' + normalizedKey.substring(3)
						utmParams[newKey] = queryParams[key]
					}
				}

				if (Object.keys(utmParams).length > 0) {
					utmParams.saveAt = new Date().toISOString()
					await StorageService.setStorageJSON(VtexCustomerService.STORAGE_UTM_PARAMS_KEY, utmParams)
				}
			} catch (e) {
				console.error('Erro ao salvar parâmetros UTM', e)
				return null
			}

			if (Object.keys(utmParams).length > 0) {
				try {
					console.log('Publicando eventBus', VtexCustomerService.CHANNEL_UTM_PARAMS_KEY)
					Eitri.eventBus.publish({
						channel: VtexCustomerService.CHANNEL_UTM_PARAMS_KEY,
						broadcast: true,
						data: utmParams
					})
				} catch (e) {
					console.error('Erro ao publicar eventBus UTM', e)
				}

				try {
					Vtex.updateSegmentSession(utmParams)
				} catch (e) {
					console.error('updateSegmentSession', e)
				}
			}

			return utmParams
		}

		return null
	}

	/**
	 * Retorna parâmetros UTM salvos no Storage como um objeto.
	 *
	 * @returns {Object} Um objeto contendo os parâmetros UTM salvos no Storage.
	 * @property {string} utm_campaignid - O ID da campanha.
	 * @property {string} utm_campaign - O nome da campanha.
	 * @property {string} utm_source - A fonte do tráfego.
	 * @property {string} utm_medium - O meio da campanha.
	 * @property {string} utm_term - O termo da campanha.
	 * @property {string} utm_content - O conteúdo da campanha.
	 */
	static async getUtmParams() {
		try {
			const utmParams = await StorageService.getStorageJSON(VtexCustomerService.STORAGE_UTM_PARAMS_KEY)

			if (utmParams?.saveAt) {
				const cutDate = new Date()
				cutDate.setDate(cutDate.getDate() - VtexCustomerService.TIME_EXPIRES_UTM_PARAMS_IN_DAYS) // atrasa a data em X dias

				if (cutDate.toISOString() > utmParams.saveAt) {
					// retornando vazio se o valor expirou
					return {}
				}
			}

			return utmParams || {}
		} catch (e) {
			console.error('Erro ao obter parâmetros UTM', e)
		}

		return {}
	}

	static async executeRefreshToken() {
		const { account } = Vtex.configs

		const res = await VtexCustomerService.getStorageCustomerToken()

		if (!res) return
		if (res?.creationTimeStamp + VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC > Math.floor(Date.now() / 1000)) {
			return null
		}

		if (res?.refreshToken && res?.token) {
			const loginRes = await VtexCaller.post(
				`api/vtexid/refreshtoken/webstore`,
				{},
				{
					headers: {
						accept: '*/*',
						Cookie: `vid_rt=${res.refreshToken};VtexIdclientAutCookie_${account}=${res.token}`
					}
				}
			)

			const refreshToken = extractCookies(loginRes, 'vid_rt')
			const newToken = extractCookies(loginRes, `VtexIdclientAutCookie_${account}`)

			if (newToken && refreshToken) {
				await VtexCustomerService.setCustomerToken(newToken, refreshToken)
			}
		}
	}

	static async _processPostLogin(authCookie, refreshToken) {
		await VtexCustomerService.setCustomerToken(authCookie, refreshToken)

		try {
			const result = await VtexCustomerService.getCustomerProfile()
			if (result) {
				await VtexCustomerService.notifyLoginToExposedApis(result?.data?.profile?.userId)
				await VtexCustomerService.setCustomerData('email', result?.data?.profile?.email)
				await VtexCustomerService.setCustomerData('userId', result?.data?.profile?.userId)
			}
		} catch (e) {}
	}
}
