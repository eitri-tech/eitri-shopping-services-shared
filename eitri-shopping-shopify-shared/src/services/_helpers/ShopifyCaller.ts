import Eitri from 'eitri-bifrost'
import RemoteConfig from '../RemoteConfig'
import Logger from './Logger'

export default class ShopifyCaller {
	static _mountUrl = (): string => {
		const version = RemoteConfig.getContent('providerInfo.apiVersion') || '2026-01'
		let host = RemoteConfig.getContent('providerInfo.host')

		if (!host) {
			throw new Error('Nenhum host definido para essa loja')
		}

		if (!/^https?:\/\//.test(host)) {
			host = `https://${host}`
		}

		return new URL(`/api/${version}/graphql.json`, host).toString()
	}

	static _mountHeader = () => {
		const storefrontAccessToken = RemoteConfig.getContent('providerInfo.storefrontAccessToken')
		return {
			'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
			'Content-Type': 'application/json'
		}
	}

	static async post(data = {}, options = { headers: {} }, baseUrl?: string) {
		const url = baseUrl || ShopifyCaller._mountUrl()
		const _headers = ShopifyCaller._mountHeader()

		Logger.log('==Executando POST em ===>', url)
		Logger.log('==BODY ===>', data)

		const res = await Eitri.http.post(url, data, {
			...options,
			headers: {
				..._headers,
				...(options?.headers || {})
			}
		})

		Logger.log('=== POST Finalizado ===>', url)

		return res
	}

	static async get(options = { headers: {} }, baseUrl?: string) {
		const url = baseUrl || ShopifyCaller._mountUrl()
		const _headers = ShopifyCaller._mountHeader()

		Logger.log('==Executando GET em ===>', url)

		const res = await Eitri.http.get(url, {
			...options,
			headers: {
				..._headers,
				...(options?.headers || {})
			}
		})

		Logger.log('=== GET Finalizado ===>', url)

		return res
	}

	static async postStream(data = {}, callback: (data: string) => void, options = { headers: {} }, baseUrl?: string) {
		const url = baseUrl || ShopifyCaller._mountUrl()
		const storefrontAccessToken = RemoteConfig.getContent('providerInfo.storefrontAccessToken')

		Logger.log('==Executando POST Stream em ===>', url)
		Logger.log('==BODY ===>', data)

		const res = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(data),
			...options,
			headers: {
				'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
				'Content-Type': 'application/json',
				'Accept': 'multipart/mixed; deferSpec=20220824, application/json',
				...(options?.headers || {})
			}
		})

		if (!res.body) {
			throw new Error('Response body is not available')
		}

		const reader = res.body.getReader()
		const decoder = new TextDecoder()

		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				Logger.log('=== Stream Finalizado ===>', url)
				break
			}

			const chunk = decoder.decode(value, { stream: true })
			callback(chunk)
		}

		return res
	}
}
