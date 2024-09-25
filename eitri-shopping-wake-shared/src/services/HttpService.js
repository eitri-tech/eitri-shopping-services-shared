import Eitri from 'eitri-bifrost'
import WakeService from './WakeService'

export default class WakeCaller {
	static _mountUrl = (baseUrl, path) => {
		try {
			return new URL(`${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`)
		} catch (error) {
			console.log('Erro ao montar URL', `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`, error)
		}
	}

	static _getHeaders = async () => {
		const configs = await WakeService.configs
		
		const headers = {
			'Content-Type': 'application/json',
			'Accept': '*/*',
			'TCS-Access-Token': `${'tcs_shopf_29a1f7bee4a84f0f8acd13ba65a173bf' || configs.tcs_account}`
		}

		return headers
	}

	static async get(path, options = {}, baseUrl) {
		const _baseUrl = baseUrl || WakeService.configs.api
		const url = WakeCaller._mountUrl(_baseUrl, path)
		const headers = await WakeCaller._getHeaders()

		const res = Eitri.http.get(url.href, {
			...options,
			headers: {
				...headers,
				...options.headers
			}
		})

		return res
	}

	static async post(path, data, options = {}, baseUrl) {
		const _baseUrl = baseUrl || WakeService.configs.api
		const url = WakeCaller._mountUrl(_baseUrl, path)
		const headers = await WakeCaller._getHeaders()

		const res = await Eitri.http.post(url.href, data, {
			...options,
			headers: {
				...headers,
				...options.headers
			}
		})

		return res
	}
};
