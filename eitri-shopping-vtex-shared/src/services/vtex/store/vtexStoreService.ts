import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'

type AuthConfig = {
	passwordAuthentication: boolean
	accessKeyAuthentication: boolean
	passkeyAuthentication: boolean
	samlProviders: any[]
	corporateProviders: any[]
	oAuthProviders: {
		providerName: string
		className: string
		expectedContext: any[]
	}[]
	sessionRenewal: boolean
}

export default class VtexStoreService {
	static async getLoginProviders(scope?: String, accountName?: String): Promise<AuthConfig> {
		const { account } = Vtex.configs
		const response = await VtexCaller.get(
			`api/vtexid/pub/authentication/providers?scope=${scope || account}&accountName=${accountName || account}`
		)
		return response.data
	}
}
