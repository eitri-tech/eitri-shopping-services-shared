import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import { sendLogError } from '@/services/Datadog'

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
		try {
			const { account } = Vtex.configs
			const response = await VtexCaller.get(
				`api/vtexid/pub/authentication/providers?scope=${scope || account}&accountName=${accountName || account}`
			)
			return response.data
		} catch (e) {
			sendLogError(e, 'getLoginProviders', { account: Vtex?.configs?.account ?? null })
			throw e
		}
	}
}
