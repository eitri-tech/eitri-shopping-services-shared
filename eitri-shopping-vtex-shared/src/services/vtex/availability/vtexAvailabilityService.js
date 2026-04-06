import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'

const CREATE_CONTENT_VARIANT = 'mutation AvailabilitySubscribe($name: String, $email: String, $skuId: String, $locale: String, $sellerObj: SellerObjInputType!) @context(sender: "vtex.availability-notify@1.14.1") @runtimeMeta(hash: "d975646fd9ed900ff082021a138d3db656e9ba33844b79d84d2bba15160cdcf3") {\n  availabilitySubscribe(name: $name, email: $email, skuId: $skuId, locale: $locale, sellerObj: $sellerObj)\n}\n'

export default class VtexAvailabilityService {

	static async subscribeAvailability(skuId, name, email) {
		const locale = Vtex.configs.locale
		const sellerObj = {}

		const variables = {
			skuId: String(skuId),
			name,
			email,
			locale,
			sellerObj
		}

		const encodedVariables = btoa(JSON.stringify(variables))

		const graphqlBodyData = {
            operationName: "AvailabilitySubscribe",
            query: CREATE_CONTENT_VARIANT,
            variables: {},
			extensions: {
				variables: encodedVariables
			}
        };

		const response = await VtexCaller.post(
			`_v/private/graphql/v1`,
			graphqlBodyData,
			{},
			Vtex.configs.host,
			{ 'content-type': 'application/json' }
		)

		return response.data
	}
}
