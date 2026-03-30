import Eitri from 'eitri-bifrost'
import Vtex from '../../Vtex'
import StorageService from '../../StorageService'
import VtexCaller from '../_helpers/_vtexCaller'
import extractCookies from '../_helpers/extractCookies'
import { sendDatadogWarningLog, sendLogError } from '@/services/Datadog'
import EventBus from '@/services/EventBus'
import EventBusChannels from '@/services/EventBusChannels'
import VtexSessionService from '@/services/vtex/session/vtexSessionService'

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
		const { authStatus } = data

		if (authStatus === 'Success') {
			await VtexCustomerService.setCustomerData('email', email)
			await VtexCustomerService._processPostLogin(data, refreshToken)
		}

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
		const { authStatus } = data

		if (authStatus === 'Success') {
			await VtexCustomerService.setCustomerData('email', email)
			await VtexCustomerService._processPostLogin(data, refreshToken)
		}

		return authStatus
	}

	static async loginWithGoogle() {
		let webFlowRes = await Eitri.webFlow.start({
			startUrl: `${Vtex.configs.host}/login?returnUrl=/account`,
			stopPattern: `${Vtex.configs.host}/api/vtexid/oauth/finish`,
			allowedDomains: ['*'],
			maxNavigationLimit: 20,
			keepLoadingScreenUntilDomainChange: true,
			onLoadJsScript: `
      const interval = setInterval(() => {
        const googleBtnWrapper = document.querySelector(".vtex-login-2-x-googleOptionBtn");
        const googleBtn = googleBtnWrapper?.querySelector("button");
        const label = googleBtn?.querySelector(".vtex-login-2-x-oauthLabel");
        
        const isVisible = googleBtn && googleBtn.offsetParent !== null;
        const isEnabled = googleBtn && !googleBtn.disabled;
        const hasLabel = label && label.textContent?.toLowerCase().includes("google");

        if (googleBtn && isVisible && isEnabled && hasLabel) {
          clearInterval(interval);
          console.log("Google login button ready. Clicking...");
          googleBtn.click();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        console.log("WebFlow Timeout: Google button was not found or ready in time.");
      }, 10000);
    `
		})

		const finishNavigation = webFlowRes?.recordedNavigation?.find(n => n.url.includes(`api/vtexid/oauth/finish`))

		if (finishNavigation) {
			await VtexCustomerService._processPostSocialLogin(finishNavigation.url)
		} else {
			throw new Error('Google login failed')
		}
	}

	static async loginWithFacebook() {
		let webFlowRes = await Eitri.webFlow.start({
			startUrl: `${Vtex.configs.host}/login?returnUrl=/account`,
			stopPattern: `${Vtex.configs.host}/api/vtexid/oauth/finish`,
			allowedDomains: ['*'],
			maxNavigationLimit: 20,
			keepLoadingScreenUntilDomainChange: true,
			onLoadJsScript: `
          const interval = setInterval(() => {
            const facebookBtnWrapper = document.querySelector(".vtex-login-2-x-facebookOptionBtn");
            const facebookBtn = facebookBtnWrapper?.querySelector("button");
            const label = facebookBtn?.querySelector(".vtex-login-2-x-oauthLabel");
            
            const isVisible = facebookBtn && facebookBtn.offsetParent !== null;
            const isEnabled = facebookBtn && !facebookBtn.disabled;
            const hasLabel = label && label.textContent?.toLowerCase().includes("facebook");

            if (facebookBtn && isVisible && isEnabled && hasLabel) {
              clearInterval(interval);
              console.log("Facebook login button ready. Clicking...");
              facebookBtn.click();
            }
          }, 500);

          setTimeout(() => {
            clearInterval(interval);
            console.log("WebFlow Timeout: Facebook button was not found or ready in time.");
          }, 10000);
        `
		})

		const finishNavigation = webFlowRes?.recordedNavigation?.find(n => n.url.includes(`api/vtexid/oauth/finish`))

		if (finishNavigation) {
			await VtexCustomerService._processPostSocialLogin(finishNavigation.url)
		} else {
			throw new Error('Facebook login failed')
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
				authenticationToken: VtexCustomerService.cookieValue,
				accessKey: accessKey,
				login: email,
				newPassword: newPassword
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
		const { authStatus } = data

		if (authStatus === 'Success') {
			await VtexCustomerService.setCustomerData('email', email)
			await VtexCustomerService._processPostLogin(data, refreshToken)
		}

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
		await VtexCustomerService.notifyLogoutToExposedApis()
		await StorageService.removeItem(VtexCustomerService.STORAGE_USER_TOKEN_KEY)
		await StorageService.removeItem(VtexCustomerService.STORAGE_USER_DATA)
		await VtexSessionService.updateSession({})
		EventBus.publish({
			channel: EventBusChannels.USER_LOGGED_OUT,
			broadcast: true,
			data: {}
		})
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
		return savedToken
	}

	static async getStorageCustomerToken() {
		return await StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_TOKEN_KEY)
	}

	static async setCustomerToken(token, refreshToken, accountAuthCookieId, accountAuthCookieValue) {
		const creationTimeStamp = Math.floor(Date.now() / 1000)
		return StorageService.setStorageJSON(VtexCustomerService.STORAGE_USER_TOKEN_KEY, {
			token,
			refreshToken,
			creationTimeStamp,
			accountAuthCookieId,
			accountAuthCookieValue
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

	static async getCustomerProfile(_token) {
		let token

		if (_token) {
			token = _token
		} else {
			const tokenData = await VtexCustomerService.getCustomerToken()
			token = tokenData?.token
		}

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query: 'query Profile @context(scope: "private") { profile { userId cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate } }'
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
		const tokenData = await VtexCustomerService.getCustomerToken()
		let token = tokenData?.token

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query: 'mutation UpdateProfile($profile: ProfileInput) @context(sender: "vtex.my-account@1.29.0") { updateProfile(fields: $profile) { cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate __typename } }',
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
					EventBus.publish({
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
		try {
			const { account } = Vtex.configs

			const res = await VtexCustomerService.getStorageCustomerToken()

			if (!res || !res.accountAuthCookieId) return
			if (
				res?.creationTimeStamp + VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC >
				Math.floor(Date.now() / 1000)
			) {
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
					await VtexCustomerService.setCustomerToken(
						newToken,
						refreshToken,
						res?.accountAuthCookieId,
						newToken
					)
				} else {
					sendDatadogWarningLog(
						{
							message: 'Refresh token executado sem novos tokens na resposta',
							responseHeaders: loginRes?.headers,
							response: loginRes?.data
						},
						'executeRefreshToken'
					)
				}
			} else {
				sendDatadogWarningLog(
					{
						message: 'Usuário não possui o refresh token',
						creationTimeStamp: res.creationTimeStamp
					},
					'executeRefreshToken'
				)
			}
		} catch (e) {
			sendLogError(e, 'executeRefreshToken')
		}
	}

	static async _processPostLogin(loginData, refreshToken) {
		const authCookieValue = loginData?.authCookie?.Value
		const accountAuthCookie = loginData?.accountAuthCookie

		const accountAuthCookieValue = accountAuthCookie?.Value
		const accountAuthCookieId = accountAuthCookie?.Name?.split('_')?.[1]

		const userId = loginData?.userId

		await VtexCustomerService.setCustomerToken(
			authCookieValue,
			refreshToken,
			accountAuthCookieId,
			accountAuthCookieValue
		)
		await VtexSessionService.updateSession({})
		VtexCustomerService.notifyLoginToExposedApis(userId)
		EventBus.publish({
			channel: EventBusChannels.USER_LOGGED_IN,
			broadcast: true,
			data: {}
		})
	}

	static async _processPostSocialLogin(finishNavigationUrl) {
		const params = new URL(finishNavigationUrl).searchParams

		const authCookieValue = params.get('authCookieValue')

		const accountAuthCookieId = params?.get('authCookieName')?.split('_')?.[1]
		const accountAuthCookieValue = params?.get('accountAuthCookieValue')

		const userProfile = await VtexCustomerService.getCustomerProfile(authCookieValue)

		const userId = userProfile?.data?.profile?.userId
		const email = userProfile?.data?.profile?.email

		await VtexCustomerService.setCustomerData('email', email)
		await VtexCustomerService.setCustomerToken(authCookieValue, '', accountAuthCookieId, accountAuthCookieValue)


		await VtexSessionService.updateSession({})
		VtexCustomerService.notifyLoginToExposedApis(userId)
		EventBus.publish({
			channel: EventBusChannels.USER_LOGGED_IN,
			broadcast: true,
			data: {}
		})
	}

	static async getAddresses() {

		const tokenData = await VtexCustomerService.getCustomerToken()
		const token = tokenData?.token

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query: 'query Addresses @context(scope: "private", provider: "vtex.store-graphql") { profile { cacheId addresses: address { addressId: id addressType addressName city complement country neighborhood number postalCode geoCoordinates receiverName reference state street } } }'
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

	static async createAddress(address) {
		const tokenData = await VtexCustomerService.getCustomerToken()
		let token = tokenData?.token

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query: 'mutation SaveAddress($address: AddressInput!) { saveAddress(address: $address) @context(provider: "vtex.store-graphql") {id cacheId } }',
			variables: {
				address: address
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

	static async updateAddress(addressId, addressFields) {
		const tokenData = await VtexCustomerService.getCustomerToken()
		let token = tokenData?.token

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query:
				'mutation UpdateAddress($addressId: String, $addressFields: AddressInput) {\n' +
				'  updateAddress(id: $addressId, fields: $addressFields)\n' +
				'    @context(provider: "vtex.store-graphql") {\n' +
				'    cacheId\n' +
				'    addresses: address {\n' +
				'      addressId: id\n' +
				'      addressType\n' +
				'      addressName\n' +
				'      city\n' +
				'      complement\n' +
				'      country\n' +
				'      neighborhood\n' +
				'      number\n' +
				'      postalCode\n' +
				'      receiverName\n' +
				'      reference\n' +
				'      state\n' +
				'      street\n' +
				'    }\n' +
				'  }\n' +
				'}',
			variables: {
				addressId: addressId,
				addressFields: addressFields
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

	static async deleteAddress(addressId) {
		const tokenData = await VtexCustomerService.getCustomerToken()
		let token = tokenData?.token

		if (!token) {
			throw new Error('User not logged in')
		}

		const body = {
			query:
				'mutation DeleteAddress($addressId: String) {\n' +
				'  deleteAddress(id: $addressId) {\n' +
				'    cacheId\n' +
				'    addresses: address {\n' +
				'      addressId: id\n' +
				'      addressType\n' +
				'      addressName\n' +
				'      city\n' +
				'      complement\n' +
				'      country\n' +
				'      neighborhood\n' +
				'      number\n' +
				'      postalCode\n' +
				'      geoCoordinates\n' +
				'      receiverName\n' +
				'      reference\n' +
				'      state\n' +
				'      street\n' +
				'    }\n' +
				'  }\n' +
				'}',
			variables: {
				addressId: addressId
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

}
