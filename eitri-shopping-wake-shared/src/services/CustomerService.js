import Eitri from 'eitri-bifrost'
import GraphqlService from './GraphqlService'
import StorageService from './StorageService'
import { ApiError } from './Api'
import {
	queryAddWishlistProduct,
	queryCreateAddress,
	queryCreateCustomer,
	queryCustomer,
	queryCustomerAccessTokenRenew,
	queryGetCustomerWishlist,
	queryLogin,
	queryRemoveAddress,
	queryRemoveWishlistProduct,
	querySimpleCustomer,
	queryUpdateAddress,
	queryCustomerCompletePartialRegistration,
	queryCustomerPasswordChange,
	querySimpleLogin,
	queryCustomerOrders,
	queryCustomerUpdate,
	querySimpleLoginVerifyAnwser,
	queryCustomerSimple
} from '../queries/Customer'
import { Wake } from '../export'
import StoreService from './StoreService'
import { sendLogError } from './Datadog'

export default class CustomerService {
	static STORAGE_USER_TOKEN_KEY = 'user_key'

	static MSG_ERROR = {
		INVALID_LOGIN: 'Invalid login'
	}

	/**
	 * Faz login do usuário.
	 * @param {string} input - Login do usuário.
	 * @param {string} pass - Senha do usuário.
	 */
	static async customerAuthenticatedLogin(input, pass) {
		try {
			const response = await GraphqlService.query(queryLogin, {
				input: input,
				pass: pass
			})

			const data = response.data

			await CustomerService.saveCustomerTokenOnStorage(data)

			return data
		} catch (e) {
			console.error('[SHARED] [customerAuthenticatedLogin] Falha ao realizar login', e)
			throw e
		}
	}

	static async createCustomer(customer) {
		try {
			const response = await GraphqlService.query(queryCreateCustomer, {
				input: customer
			})

			return response
		} catch (e) {
			console.error('[SHARED] [createCustomer] Erro ao criar customer', e)
			sendLogError(e, "createCustomer")
			throw e
		}
	}

	static async customerSimpleLoginStart(email) {
		try {
			const response = await GraphqlService.query(querySimpleLogin, {
				input: email
			})

			if (response?.data?.type !== 'NEW' && response?.data?.customerAccessToken) {
				await CustomerService.saveCustomerTokenOnStorage(response?.data?.customerAccessToken)
			}

			return response?.data
		} catch (e) {
			console.error('[SHARED] [customerSimpleLoginStart] Erro ao iniciar', e)
			throw e
		}
	}

	static async customerSimpleLoginVerifyAnwser(email, questionId, answerId) {
		try {
			const response = await GraphqlService.query(querySimpleLoginVerifyAnwser, {
				input: email,
				questionId,
				answerId
			})

			if (response?.customerSimpleLoginVerifyAnwser?.customerAccessToken) {
				await CustomerService.saveCustomerTokenOnStorage(
					response?.customerSimpleLoginVerifyAnwser?.customerAccessToken
				)
			}

			return response?.customerSimpleLoginVerifyAnwser
		} catch (e) {
			console.error('[SHARED] [customerSimpleLoginVerifyAnwser] Erro simple login customer', e)
			throw e
		}
	}

	static async customerUpdate(customer) {
		try {
			const savedToken = await CustomerService.getCustomerToken()
			if (!savedToken) {
				return null
			}

			const response = await GraphqlService.query(queryCustomerUpdate, {
				customerAccessToken: savedToken,
				input: customer
			})

			return response
		} catch (e) {
			console.error('[SHARED] [updateCustomer] Erro ao atualizar customer', e)
			sendLogError(e, "customerUpdate")
			throw e
		}
	}

	static async customerCompletePartialRegistration(newCustomerAccessToken, input) {
		try {
			const response = await GraphqlService.query(queryCustomerCompletePartialRegistration, {
				customerAccessToken: newCustomerAccessToken,
				input
			})

			if (response.customerCompletePartialRegistration) {
				await CustomerService.saveCustomerTokenOnStorage(response.customerCompletePartialRegistration)
			}

			return response.customerCompletePartialRegistration
		} catch (e) {
			console.error('[SHARED] [createCustomer] Erro ao criar customer', e)
			throw e
		}
	}

	static async customerPasswordChange(customerAccessToken, currentPassword, newPassword) {
		try {
			const response = await GraphqlService.query(queryCustomerPasswordChange, {
				customerAccessToken,
				input: {
					currentPassword,
					newPasswordConfirmation: newPassword,
					newPassword
				}
			})

			return response
		} catch (e) {
			console.error('[SHARED] [customerPasswordChange] Erro ao mudar senha', e)
			throw e
		}
	}

	static async getSimpleCustomer() {
		try {
			const savedToken = await CustomerService.getCustomerToken()
			if (!savedToken) {
				return null
			}

			const response = await GraphqlService.query(querySimpleCustomer, {
				customerAccessToken: savedToken
			})

			return response
		} catch (e) {
			console.error('[SHARED] [getCustomer] Erro ao busca customer', e)
			sendLogError(e, "getSimpleCustomer")
			throw e
		}
	}

	static async getCustomer() {
		try {
			const accessTokenData = await CustomerService.getCustomerAccessTokenData()

			const savedToken = await CustomerService.getCustomerToken()
			if (!accessTokenData) {
				return null
			}

			const response = await GraphqlService.query(
				accessTokenData.type === 'SIMPLE' ? queryCustomerSimple : queryCustomer,
				{
					customerAccessToken: savedToken
				}
			)

			return response
		} catch (e) {
			console.error('[SHARED] [getCustomer] Erro ao busca customer', e)
			sendLogError(e, "getCustomer")
			throw e
		}
	}

	static async saveCustomerTokenOnStorage(data) {
		return StorageService.setStorageJSON(CustomerService.STORAGE_USER_TOKEN_KEY, data)
	}

	static async getCustomerToken() {
		const loginData = await StorageService.getStorageJSON(CustomerService.STORAGE_USER_TOKEN_KEY)
		if (!loginData?.validUntil) {
			return null
		}
		const now = new Date()
		const expDate = new Date(loginData.validUntil)

		// O token expira em 90 dias, se for menor, renovar
		const diff60Days = 60 * 24 * 60 * 60 * 1000
		if (expDate.getTime() - now.getTime() < diff60Days) {
			try {
				const response = await GraphqlService.query(queryCustomerAccessTokenRenew, {
					customerAccessToken: loginData.token
				})

				const data = response.data

				CustomerService.saveCustomerTokenOnStorage({ ...loginData, ...data })

				return response.data.token
			} catch (e) {
				
				// isolando erros que são corrigidos no fluxo
				if (typeof e?.message === 'string' && e.message.includes('"code":"TKN100"')) {
					console.error('[SHARED] [refreshCustomerToken]', e)
					return null
				}

				sendLogError(e, "refreshCustomerToken")
				return null
			}
		} else {
			return loginData.token
		}
	}

	static async getCustomerAccessTokenData() {
		const loginData = await StorageService.getStorageJSON(CustomerService.STORAGE_USER_TOKEN_KEY)
		return loginData
	}

	static async createAddress(address) {
		try {
			const savedToken = await CustomerService.getCustomerToken()
			if (!savedToken) {
				return null
			}

			const response = await GraphqlService.query(queryCreateAddress, {
				address,
				customerAccessToken: savedToken
			})

			return response
		} catch (e) {
			console.error('[SHARED] [createAddress] Erro ao criar endereço', e)
			sendLogError(e, "createAddress")
			throw e
		}
	}

	static async updateAddress(addressId, address) {
		try {
			const savedToken = await CustomerService.getCustomerToken()
			if (!savedToken) {
				return null
			}

			const response = await GraphqlService.query(queryUpdateAddress, {
				address,
				customerAccessToken: savedToken,
				id: addressId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [createAddress] Erro ao criar endereço', e)
			sendLogError(e, "updateAddress")
			throw e
		}
	}

	static async removeAddress(addressId) {
		try {
			const savedToken = await CustomerService.getCustomerToken()
			if (!savedToken) {
				return null
			}

			const response = await GraphqlService.query(queryRemoveAddress, {
				customerAccessToken: savedToken,
				id: addressId
			})

			return response
		} catch (e) {
			console.error('[SHARED] [removeAddress] Erro ao remover endereço', e)
			throw e
		}
	}

	static async isLoggedIn() {
		const savedToken = await CustomerService.getCustomerToken()
		if (savedToken) {
			return true
		}
		return false
	}

	static async logout() {
		await StorageService.removeItem(CustomerService.STORAGE_USER_TOKEN_KEY)
		await StoreService.removeCustomerPartnerAccessToken()
		return true
	}

	static async getWishList() {
		const token = await CustomerService.getCustomerToken()
		if (!token) {
			throw new ApiError(CustomerService.MSG_ERROR.INVALID_LOGIN, 401)
		}

		const response = await GraphqlService.query(queryGetCustomerWishlist, {
			customerAccessToken: token
		})
		return response?.customer?.wishlist?.products || null
	}

	static async addWishlistProduct(productId) {
		const token = await CustomerService.getCustomerToken()
		if (!token) {
			throw new ApiError(CustomerService.MSG_ERROR.INVALID_LOGIN, 401)
		}

		const response = await GraphqlService.query(queryAddWishlistProduct, {
			customerAccessToken: token,
			productId: parseInt(productId)
		})

		EventBus.publish({
			channel: "addToWishlist",
			broadcast: true,
			data: {
				productId
			}
		});

		return response?.wishlistAddProduct || null
	}

	static async removeWishlistProduct(productId) {
		const token = await CustomerService.getCustomerToken()
		if (!token) {
			throw new ApiError(CustomerService.MSG_ERROR.INVALID_LOGIN, 401)
		}

		const response = await GraphqlService.query(queryRemoveWishlistProduct, {
			customerAccessToken: token,
			productId: parseInt(productId)
		})

		Eitri.eventBus.publish({
			channel: "removeFromWishlist",
			broadcast: true,
			data: {
				productId
			}
		});

		return response?.wishlistRemoveProduct || null
	}

	static async getAddressByZipCode(zipCode) {
		try {
			const response = await GraphqlService.query(
				`query ($cep: CEP! ) {
					  address(cep:$cep) {
						city
						country
						neighborhood
						state
						street
						cep
					  }
				}`,
				{
					cep: zipCode
				}
			)
			return response.address
		} catch (e) {
			console.error('[SHARED] [getAddressByZipCode] Erro ao buscar endereço pelo CEP', e)
			throw e
		}
	}

	static async customerPasswordRecovery(email) {
		try {
			const response = await GraphqlService.query(
				`
          mutation ($input: String! ) {
            customerPasswordRecovery(input: $input) {
              isSuccess
            }
          }`,
				{
					input: email
				}
			)

			return response
		} catch (e) {
			console.error('[SHARED] [customerPasswordRecovery] Erro ao solicitar email', e)
			throw e
		}
	}

	static async customerPasswordChangeByRecovery(key, newPassword) {
		try {
			const response = await GraphqlService.query(
				`
          mutation ($input: CustomerPasswordChangeByRecoveryInputGraphInput!){
            customerPasswordChangeByRecovery(input: $input) {
              isSuccess
            }
          }`,
				{
					key,
					newPassword,
					newPasswordConfirmation: newPassword
				}
			)

			return response
		} catch (e) {
			console.error('[SHARED] [customerPasswordChangeByRecovery] Erro ao recuperar senha', e)
			throw e
		}
	}

	static async getCustomerOrders() {
		try {
			const savedToken = await CustomerService.getCustomerToken()
			if (!savedToken) {
				return null
			}

			const response = await GraphqlService.query(queryCustomerOrders, {
				customerAccessToken: savedToken
			})

			return response
		} catch (e) {
			console.error('[SHARED] [getCustomerOrders] Erro ao obter pedidos', e)
			throw e
		}
	}
}
