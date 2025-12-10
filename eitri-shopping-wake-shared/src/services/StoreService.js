import GraphqlService from './GraphqlService'
import StorageService from '@/services/StorageService'

export default class StoreService {
	static GLOBAL_PARTNER_ACCESS_TOKEN_KEY = 'globalPartnerAccessTokenKey'
	static CUSTOMER_PARTNER_ACCESS_TOKEN_KEY = 'customerPartnerAccessTokenKey'
	static GLOBAL_ZIP_CODE_KEY = 'globalZipCode'

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

	static async loadPartnerAccessToken(partnerId) {
		const query = `query {
				  partners(first:50){
					edges{
						cursor
					  node{
						id
						type
						alias
						partnerAccessToken
						partnerId
						name
						startDate
						endDate
						priceTableId
						portfolioId
						origin
					  }
					}
				  }
				}`

		const response = await GraphqlService.query(query)

		let partners = response.partners.edges
		const partner = partners.find(partner => partner.node.id === partnerId || partner.node.partnerId === partnerId)
		if (partner) {
			await StoreService.setGlobalPartnerAccessToken(partner.node.partnerAccessToken)
		}

		return partner
	}

	static async getPartnerAccessToken() {
		const customerPartnerAccessToken = await StorageService.getStorageItem(
			StoreService.CUSTOMER_PARTNER_ACCESS_TOKEN_KEY
		)
		if (customerPartnerAccessToken) {
			return customerPartnerAccessToken
		}
		const globalPartnerAccessToken = await StorageService.getStorageItem(
			StoreService.GLOBAL_PARTNER_ACCESS_TOKEN_KEY
		)
		return globalPartnerAccessToken || null
	}

	static async setGlobalPartnerAccessToken(partnerAccessToken) {
		if (!partnerAccessToken) {
			console.log('[SHARED] partner access token not set')
			return
		}
		await StorageService.setStorageItem(StoreService.GLOBAL_PARTNER_ACCESS_TOKEN_KEY, partnerAccessToken)
		console.log('[SHARED] partner access token set to ' + partnerAccessToken)
	}

	static async setCustomerPartnerAccessToken(partnerAccessToken) {
		if (!partnerAccessToken) {
			console.log('[SHARED] global partner access token not set')
			return
		}
		await StorageService.setStorageItem(StoreService.CUSTOMER_PARTNER_ACCESS_TOKEN_KEY, partnerAccessToken)
		console.log('[SHARED] customer partner access token set to ' + partnerAccessToken)
	}

	static async removeCustomerPartnerAccessToken() {
		await StorageService.removeItem(StoreService.CUSTOMER_PARTNER_ACCESS_TOKEN_KEY)
		console.log('[SHARED] customer partner access token removed')
	}

	static async setGlobalZipCode(zipCode) {
		if (zipCode?.trim()?.length > 0) {
			await StorageService.setStorageItem(StoreService.GLOBAL_ZIP_CODE_KEY, zipCode)
		} else {
			await StorageService.removeItem(StoreService.GLOBAL_ZIP_CODE_KEY)
		}
	}

	static async getGlobalZipCode() {
		const zipCode = await StorageService.getStorageItem(StoreService.GLOBAL_ZIP_CODE_KEY)
		return zipCode || ''
	}
}
