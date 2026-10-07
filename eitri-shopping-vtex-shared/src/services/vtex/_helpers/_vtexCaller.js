import Eitri from 'eitri-bifrost'
import vtexConfig from '../vtexConfig'
import { getCustomerToken, getSessionToken } from './vtexAuth'
import Logger from '../../Logger'
import StorageService from '../../StorageService'

export default class VtexCaller {
	static _mountUrl = (baseUrl, path) => {
		try {
			return new URL(`${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`)
		} catch (error) {
			console.log('Erro ao montar URL', `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`, error)
		}
	}

	static _getHeaders = async () => {
		const headers = {
			'Content-Type': 'application/json',
			'accept': 'application/json'
		}

		const tokenData = await getCustomerToken()

		if (tokenData) {
			const account = vtexConfig.account
			// headers[`VtexIdclientAutCookie`] = tokenData.token
			headers['Cookie'] = `VtexIdclientAutCookie_${account}=${tokenData.token}`
		}

		const sessionToken = await getSessionToken()

		if (sessionToken) {

			const _cookie = `vtex_segment=${sessionToken?.segmentToken};vtex_session=${sessionToken?.sessionToken}`

			if (headers['Cookie']) {
				headers['Cookie'] += `;${_cookie}`
			} else {
				headers['Cookie'] = `${_cookie}`
			}
		}

		const paymentAuth = await StorageService.getStorageItem('vtex_chk_payment_auth')
		if (paymentAuth) {
			if (headers['Cookie']) {
				headers['Cookie'] += `;CheckoutDataAccess=VTEX_CHK_Payment_Auth=${paymentAuth}`
			} else {
				headers['Cookie'] = `CheckoutDataAccess=VTEX_CHK_Payment_Auth=${paymentAuth}`
			}
		}

		return headers
	}

	static async get(path, options = {}, baseUrl) {
		const _baseUrl = baseUrl || vtexConfig.api
		const url = VtexCaller._mountUrl(_baseUrl, path)
		const headers = await VtexCaller._getHeaders()

		Logger.log('===Fazendo Get na API===')
		Logger.log('URL ========>', url.href)
		Logger.log('HEADERS ========>', {
			...headers,
			...options?.headers
		})

		const fullHeaders = {
			...headers,
			...options?.headers
		}

		const res = await Eitri.http.get(url.href, {
			...options,
			headers: fullHeaders
		})

		Logger.log('==Resposta do Get Recebida===')

		return res
	}

	static async post(path, data, options = {}, baseUrl, overrideHeaders) {
		const _baseUrl = baseUrl || vtexConfig.api
		const url = VtexCaller._mountUrl(_baseUrl, path)
		const headers = overrideHeaders || (await VtexCaller._getHeaders())

		Logger.log('===Fazendo Post na API===')
		Logger.log('URL ========>', url.href)
		Logger.log('HEADERS ======>', {
			...headers,
			...options?.headers
		})
		Logger.log('BODY =======>', data)

		const fullHeaders = {
			...headers,
			...options?.headers
		}

		const res = await Eitri.http.post(url.href, data, {
			...options,
			headers: fullHeaders
		})
		Logger.log('==Resposta do Get Recebida===')
		return res
	}

	static async patch(path, data, options = {}, baseUrl) {
		const _baseUrl = baseUrl || vtexConfig.api
		const url = VtexCaller._mountUrl(_baseUrl, path)
		const headers = await VtexCaller._getHeaders()

		Logger.log('===Fazendo Patch na API===')
		Logger.log('URL ========>', url.href)
		Logger.log('HEADERS ======>', {
			...headers,
			...options?.headers
		})
		Logger.log('BODY =======>', data)

		const res = await Eitri.http.patch(url.href, data, {
			...options,
			headers: {
				...headers,
				...options?.headers
			}
		})

		return res
	}

	static async put(path, data, options = {}, baseUrl) {
		const _baseUrl = baseUrl || vtexConfig.api
		const url = VtexCaller._mountUrl(_baseUrl, path)
		const headers = await VtexCaller._getHeaders()

		Logger.log('===Fazendo PUT na API===')
		Logger.log('URL ========>', url.href)
		Logger.log('HEADERS ======>', {
			...headers,
			...options?.headers
		})
		Logger.log('BODY =======>', data)

		const res = await Eitri.http.put(url.href, data, {
			...options,
			headers: {
				...headers,
				...options?.headers
			}
		})

		return res
	}

	static async delete(path, options = {}, baseUrl) {
		const _baseUrl = baseUrl || vtexConfig.api
		const url = VtexCaller._mountUrl(_baseUrl, path)
		const headers = await VtexCaller._getHeaders()

		Logger.log('===Fazendo Delete na API===')
		Logger.log('URL ========>', url.href)
		Logger.log('HEADERS ======>', {
			...headers,
			...options?.headers
		})

		const res = await Eitri.http.delete(url.href, {
			...options,
			headers: {
				...headers,
				...options?.headers
			}
		})

		return res
	}
}
