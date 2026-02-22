import objectToQueryString from '../_helpers/objectToQueryString'
import VtexCaller from '../_helpers/_vtexCaller'
import Eitri from 'eitri-bifrost'
import RemoteConfig from '@/services/RemoteConfig'

export default class VtexCmsService {
	static async getAllContentTypes(projectId) {

		const account = RemoteConfig.getContent('providerInfo.account')
		const vtexCmsUrl = RemoteConfig.getContent('providerInfo?.vtexCmsUrl')

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const result = await VtexCaller.get(`/_v/cms/api/${projectId}`, {}, BASE_URL)
		return result?.data
	}

	static async getPagesByContentTypes(projectId, contentTypeId, options) {

		const account = RemoteConfig.getContent('providerInfo.account')
		const vtexCmsUrl = RemoteConfig.getContent('providerInfo?.vtexCmsUrl')

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const queryString = objectToQueryString(options)
		const result = await VtexCaller.get(`/_v/cms/api/${projectId}/${contentTypeId}?${queryString}`, {}, BASE_URL)
		return result?.data
	}

	static async getCmsPage(projectId, contentTypeId, documentId, options) {

		const account = RemoteConfig.getContent('providerInfo.account')
		const vtexCmsUrl = RemoteConfig.getContent('providerInfo?.vtexCmsUrl')

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
