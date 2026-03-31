import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'

export default class VtexAvailabilityService {

	static async subscribeAvailability(skuId, name, email) {
		const variables = {
			acronym: "AS",
			document: {
				fields: [
					{ key: "skuId",            value: String(skuId) },
					{ key: "name",             value: name },
					{ key: "email",            value: email },
					{ key: "notificationSend", value: "false" },
					{ key: "createdAt",        value: new Date().toISOString() }
				]
			}
		}

		const encodedVariables = btoa(JSON.stringify(variables))

		const body = {
			operationName: "availabilitySubscribe",
			variables: {},
			extensions: {
				persistedQuery: {
					version: 1,
					sha256Hash: "8b059022fc39294a310133833c9a54323691d52c13767cefce52abc5d5515729",
					sender: "vtex.store-components@3.x",
					provider: "vtex.store-graphql@2.x"
				},
				variables: encodedVariables
			}
		}

		const response = await VtexCaller.post(
			`_v/private/graphql/v1?workspace=master&maxAge=long&appsEtag=remove&domain=store&locale=pt-BR`,
			body,
			{},
			Vtex.configs.host,
			{ 'content-type': 'application/json' }
		)

		return response.data
	}
}
