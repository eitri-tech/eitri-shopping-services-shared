import Eitri from 'eitri-bifrost'
import objectToQueryString from '../_helpers/objectToQueryString'
import Vtex from '../../Vtex'
import VtexCaller from '../_helpers/_vtexCaller'

export default class VtexCmsService {
	static async getAllContentTypes(projectId) {
		const { account } = Vtex.configs
		const BASE_URL = `https://${account}.myvtex.com`

		const result = await VtexCaller.get(`/_v/cms/api/${projectId}`, {}, BASE_URL)
		return result?.data
	}

	static async getPagesByContentTypes(projectId, contentTypeId, options) {
		const { faststore } = Vtex.configs
		const BASE_URL = `https://euentregobr.myvtex.com`
		const queryString = objectToQueryString(options)
		const result = await VtexCaller.get(`/_v/cms/api/${faststore}/${contentTypeId}?${queryString}`, {}, BASE_URL)
		return result?.data
	}

	static async getCmsPage(projectId, contentTypeId, documentId, options) {
		const { account } = Vtex.configs
		const BASE_URL = `https://${account}.myvtex.com`

		const queryString = objectToQueryString(options)
		const result = await VtexCaller.get(
			`/_v/cms/api/${projectId}/${contentTypeId}/${documentId}?${queryString}`,
			{},
			BASE_URL
		)
		return result?.data
	}
}
