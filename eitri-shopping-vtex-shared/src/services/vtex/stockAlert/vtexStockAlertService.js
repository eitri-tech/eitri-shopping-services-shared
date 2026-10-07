import VtexCaller from '../_helpers/_vtexCaller'
import vtexConfig from '../vtexConfig'

export default class VtexStockAlertService {

	static async subscribeAvailability(skuId, name, email, sellerId, sellerName) {
		const SUBSCRIBE_AVAILABILITY_MUTATION = 'mutation AvailabilitySubscribe($name: String, $email: String, $skuId: String, $locale: String, $sellerObj: SellerObjInputType!) @context(sender: "vtex.availability-notify@1.14.1") {\n  availabilitySubscribe(name: $name, email: $email, skuId: $skuId, locale: $locale, sellerObj: $sellerObj)\n}\n'
		const locale = vtexConfig?.locale
		const sellerObj = {
			sellerId: sellerId ?? '',
			sellerName: sellerName ?? ''
		}

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
            query: SUBSCRIBE_AVAILABILITY_MUTATION,
            variables: {},
			extensions: {
				variables: encodedVariables
			}
        };

		const response = await VtexCaller.post(
			`_v/private/graphql/v1`,
			graphqlBodyData,
			{},
			vtexConfig.host,
		)

		return response.data
	}
}
