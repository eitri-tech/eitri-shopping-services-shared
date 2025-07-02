import objectToQueryString from '../_helpers/objectToQueryString'
import VtexCaller from '../_helpers/_vtexCaller'
import Eitri from 'eitri-bifrost'

export default class VtexCmsService {
	static async getAllContentTypes(projectId) {
		const _remoteConfig = await Eitri.environment.getRemoteConfigs()

		const account = _remoteConfig?.providerInfo?.account
		const vtexCmsUrl = _remoteConfig?.providerInfo?.vtexCmsUrl

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const result = await VtexCaller.get(`/_v/cms/api/${projectId}`, {}, BASE_URL)
		return result?.data
	}

	static async getPagesByContentTypes(projectId, contentTypeId, options) {
		const _remoteConfig = await Eitri.environment.getRemoteConfigs()

		const account = _remoteConfig?.providerInfo?.account
		const vtexCmsUrl = _remoteConfig?.providerInfo?.vtexCmsUrl

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const queryString = objectToQueryString(options)
		const result = await VtexCaller.get(`/_v/cms/api/${projectId}/${contentTypeId}?${queryString}`, {}, BASE_URL)
		return result?.data
	}

	static async getCmsPage(projectId, contentTypeId, documentId, options) {
		const _remoteConfig = await Eitri.environment.getRemoteConfigs()

		const account = _remoteConfig?.providerInfo?.account
		const vtexCmsUrl = _remoteConfig?.providerInfo?.vtexCmsUrl

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const queryString = objectToQueryString(options)
		const result = await VtexCaller.get(
			`/_v/cms/api/${projectId}/${contentTypeId}/${documentId}?${queryString}`,
			{},
			BASE_URL
		)
		return result?.data
	}
}
