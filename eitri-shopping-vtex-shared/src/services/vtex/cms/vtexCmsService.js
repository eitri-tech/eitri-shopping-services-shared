import objectToQueryString from '../_helpers/objectToQueryString'
import Vtex from '../../Vtex'
import VtexCaller from '../_helpers/_vtexCaller'

export default class VtexCmsService {

	static async getAllContentTypes(projectId) {
		const { account, vtexCmsUrl } = Vtex.configs

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const result = await VtexCaller.get(`/_v/cms/api/${projectId}`, {}, BASE_URL)
		return result?.data
	}

	static async getPagesByContentTypes(projectId, contentTypeId, options) {
		const { vtexCmsUrl, account } = Vtex.configs

		let BASE_URL = `https://${account}.myvtex.com`
		if (vtexCmsUrl) {
			BASE_URL = vtexCmsUrl
		}

		const queryString = objectToQueryString(options)
		const result = await VtexCaller.get(`/_v/cms/api/${projectId}/${contentTypeId}?${queryString}`, {}, BASE_URL)
		return result?.data
	}

	static async getCmsPage(projectId, contentTypeId, documentId, options) {
		const { vtexCmsUrl, account } = Vtex.configs

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
