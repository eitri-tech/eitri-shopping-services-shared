import VtexCaller from '../_helpers/_vtexCaller'
import App from '@/services/App'

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
		const account = App.getAccount()
		const response = await VtexCaller.get(
			`api/vtexid/pub/authentication/providers?scope=${scope || account}&accountName=${accountName || account}`
		)
		return response.data
	}
}
