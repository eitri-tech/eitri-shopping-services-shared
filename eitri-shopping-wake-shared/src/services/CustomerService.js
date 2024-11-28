import Eitri from 'eitri-bifrost'
import GraphqlService from './GraphqlService'
import {
  queryCreateAddress,
  queryCreateCustomer,
  queryCustomer,
  queryCustomerAccessTokenRenew, queryCustomerCompletePartialRegistration, queryCustomerPasswordChange,
  queryLogin, queryRemoveAddress, querySimpleCustomer, querySimpleLogin, queryUpdateAddress
} from "../queries/Customer";
import StorageService from "./StorageService";
import {Wake} from "../export";

export default class CustomerService {
  static STORAGE_USER_TOKEN_KEY = 'user_key'

  /**
   * Faz login do usuário.
   * @param {string} input - Login do usuário.
   * @param {string} pass - Senha do usuário.
   */
  static async customerAuthenticatedLogin(input, pass) {
    try {
      const response = await GraphqlService.query(queryLogin, {
        input: input,
        pass: pass,
      })

      const data = response.data

      CustomerService.saveCustomerTokenOnStorage(data)

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
      throw e
    }
  }

  static async customerSimpleLoginStart(email) {
    try {

      const response = await GraphqlService.query(querySimpleLogin, {
        input: email
      })

      return response
    } catch (e) {
      console.error('[SHARED] [createCustomer] Erro ao criar customer', e)
      throw e
    }
  }

  static async customerCompletePartialRegistration(customerAccessToken, input) {
    try {

      const response = await GraphqlService.query(queryCustomerCompletePartialRegistration, {
        customerAccessToken,
        input
      })

      return response
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
      throw e
    }
  }

  static async getCustomer() {
    try {
      const savedToken = await CustomerService.getCustomerToken()
      if (!savedToken) {
        return null
      }

      const response = await GraphqlService.query(queryCustomer, {
        customerAccessToken: savedToken
      })

      return response
    } catch (e) {
      console.error('[SHARED] [getCustomer] Erro ao busca customer', e)
      throw e
    }
  }

  static async saveCustomerTokenOnStorage(data) {
    return StorageService.setStorageJSON(CustomerService.STORAGE_USER_TOKEN_KEY, data)
  }

  static async getCustomerToken() {
    const loginData = await StorageService.getStorageJSON(CustomerService.STORAGE_USER_TOKEN_KEY)
    if (!loginData) {
      return null
    }
    const now = new Date()
    const expDate = new Date(loginData.validUntil)

    if (now.getTime() > expDate.getTime()) {
      try {
        const response = await GraphqlService.query(queryCustomerAccessTokenRenew, {
          customerAccessToken: loginData.token
        })

        const data = response.data

        CustomerService.saveCustomerTokenOnStorage({ ...loginData, ...data })

        return response.data.token

      } catch (e) {
        return null
      }

    } else {
      return loginData.token
    }
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
    return true
  }

  static async getAddressByZipCode(zipCode) {
    try {
      const response = await Eitri.http.get(`${Wake.configs.apiHost}/Login/Cadastro/BuscaEnderecoPorCep?cep=${zipCode}`)
      return response.data
    } catch (e) {
      console.error('[SHARED] [getAddressByZipCode] Erro ao buscar endereço pelo CEP', e)
      throw e
    }
  }

  static async customerPasswordRecovery(email) {
    try {
      const response = await GraphqlService.query(`
          mutation ($input: String! ) {
            customerPasswordRecovery(input: $input) {
              isSuccess
            }
          }`, {
        input: email
      })

      return response
    } catch (e) {
      console.error('[SHARED] [customerPasswordRecovery] Erro ao solicitar email', e)
      throw e
    }
  }

  static async customerPasswordChangeByRecovery(key, newPassword) {
    try {
      const response = await GraphqlService.query(`
          mutation ($input: CustomerPasswordChangeByRecoveryInputGraphInput!){
            customerPasswordChangeByRecovery(input: $input) {
              isSuccess
            }
          }`,{
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

}
