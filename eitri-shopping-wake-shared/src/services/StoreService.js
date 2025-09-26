import GraphqlService from './GraphqlService'

export default class StoreService {
	static async shop() {
		const query = `{
			  shop {
				name
				mainUrl
				checkoutUrl
				googleRecaptchaSiteKey
				mobileUrl
				mobileCheckoutUrl
				physicalStores{
				  additionalText
				  address
				  addressDetails
				  addressNumber
				  city
				  country
				  ddd
				  deliveryDeadline
				  email
				  latitude
				  longitude
				  name
				  neighborhood
				  phoneNumber
				  physicalStoreId
				  pickup
				  pickupDeadline
				  state
				  zipCode
			   }
			  }
			}`

		const response = await GraphqlService.query(query)

		return response?.shop
	}
}
