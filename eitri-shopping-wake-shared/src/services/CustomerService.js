import Eitri from 'eitri-bifrost'
import GraphqlService from './GraphqlService'
import {
  queryCreateAddress,
  queryCreateCustomer,
  queryCustomer,
  queryCustomerAccessTokenRenew,
  queryLogin, queryRemoveAddress, queryUpdateAddress
} from "../queries/Customer";
import StorageService from "./StorageService";

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
      console.error('[SHARED] [customerAuthenticatedLogin] Erro ao adicionar itens ao carrinho', e)
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

        CustomerService.saveCustomerTokenOnStorage({ ...loginData, ...data})

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

  }

}
