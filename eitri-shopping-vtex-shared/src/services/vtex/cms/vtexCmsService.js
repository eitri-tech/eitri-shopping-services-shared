import objectToQueryString from '../_helpers/objectToQueryString'
import VtexCaller from '../_helpers/_vtexCaller'
import RemoteConfig from '@/services/RemoteConfig'
import { sendLogError } from '@/services/Datadog'

export default class VtexCmsService {
	static async getAllContentTypes(projectId) {
		try {
			const account = RemoteConfig.getContent('providerInfo.account')
			const vtexCmsUrl = RemoteConfig.getContent('providerInfo.vtexCmsUrl')

			let BASE_URL = `https://${account}.myvtex.com`
			if (vtexCmsUrl) {
				BASE_URL = vtexCmsUrl
			}

			const result = await VtexCaller.get(`/_v/cms/api/${projectId}`, {}, BASE_URL)
			return result?.data
		} catch (e) {
			sendLogError(e, 'getAllContentTypes', { projectId: projectId ?? null })
			throw e
		}
	}

	static async getPagesByContentTypes(projectId, contentTypeId, options) {
		try {
			const account = RemoteConfig.getContent('providerInfo.account')
			const vtexCmsUrl = RemoteConfig.getContent('providerInfo.vtexCmsUrl')

			let BASE_URL = `https://${account}.myvtex.com`
			if (vtexCmsUrl) {
				BASE_URL = vtexCmsUrl
			}

			const queryString = objectToQueryString(options)
			const result = await VtexCaller.get(`/_v/cms/api/${projectId}/${contentTypeId}?${queryString}`, {}, BASE_URL)
			return result?.data
		} catch (e) {
			sendLogError(e, 'getPagesByContentTypes', { projectId: projectId ?? null, contentTypeId: contentTypeId ?? null })
			throw e
		}
	}

	static async getCmsPage(projectId, contentTypeId, documentId, options) {
		try {
			const account = RemoteConfig.getContent('providerInfo.account')
			const vtexCmsUrl = RemoteConfig.getContent('providerInfo.vtexCmsUrl')

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
		} catch (e) {
			sendLogError(e, 'getCmsPage', { projectId: projectId ?? null, contentTypeId: contentTypeId ?? null, documentId: documentId ?? null })
			throw e
		}
	}
}
