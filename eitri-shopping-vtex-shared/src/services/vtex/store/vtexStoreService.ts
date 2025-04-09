import VtexCaller from '../_helpers/_vtexCaller'

export default class VtexStoreService {
	static async getLoginProviders() {
		const response = await VtexCaller.get(`api/vtexid/pub/authentication/providers`)
		return response.data
	}
}
