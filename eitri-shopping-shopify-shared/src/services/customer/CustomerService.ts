import {
	Customer,
	CustomerAccessToken,
	CustomerUserError,
	CustomerAccessTokenCreateInput,
	CustomerCreateInput,
	CustomerUpdateInput,
	CustomerResetInput,
	MailingAddressInput,
	CustomerAccessTokenCreateResponse,
	CustomerCreateResponse,
	CustomerResponse,
	CustomerAccessTokenRenewResponse,
	CustomerAccessTokenDeleteResponse,
	CustomerRecoverResponse,
	CustomerResetResponse,
	CustomerUpdateResponse,
	CustomerAddressCreateResponse,
	CustomerAddressUpdateResponse,
	CustomerAddressDeleteResponse,
	CustomerDefaultAddressUpdateResponse,
	CustomerAddress
} from '../../models/Customer'
import ShopifyCaller from '../_helpers/ShopifyCaller'
import {
	CUSTOMER_ACCESS_TOKEN_CREATE,
	CUSTOMER_CREATE,
	GET_CUSTOMER,
	CUSTOMER_ACCESS_TOKEN_RENEW,
	CUSTOMER_ACCESS_TOKEN_DELETE,
	CUSTOMER_RECOVER,
	CUSTOMER_RESET,
	CUSTOMER_UPDATE,
	CUSTOMER_ADDRESS_CREATE,
	CUSTOMER_ADDRESS_UPDATE,
	CUSTOMER_ADDRESS_DELETE,
	CUSTOMER_DEFAULT_ADDRESS_UPDATE
} from '../../graphql/queries/customer.queries.gql'
import StorageService from '../StorageService'
import Logger from '../_helpers/Logger'

export class CustomerService {
	static CUSTOMER_ACCESS_TOKEN_KEY = 'shopify_customer_access_token'
	static CUSTOMER_TOKEN_EXPIRES_AT_KEY = 'shopify_customer_token_expires_at'

	static async signIn(
		input: CustomerAccessTokenCreateInput
	): Promise<{ accessToken: CustomerAccessToken | null; userErrors: CustomerUserError[] }> {
		const body = {
			query: CUSTOMER_ACCESS_TOKEN_CREATE,
			variables: {
				input
			}
		}

		Logger.log('[CustomerService] Realizando login do cliente:', input.email)

		const res = await ShopifyCaller.post(body)
		console.log(res)

		const { data } = res.data as { data: CustomerAccessTokenCreateResponse }

		const result = data.customerAccessTokenCreate

		if (result?.customerAccessToken) {
			await CustomerService.saveAccessToken(result.customerAccessToken)
			Logger.log('[CustomerService] Login realizado com sucesso')
		} else {
			Logger.log('[CustomerService] Falha no login:', result.customerUserErrors)
		}

		return {
			accessToken: result.customerAccessToken,
			userErrors: result.customerUserErrors
		}
	}

	static async signUp(
		input: CustomerCreateInput
	): Promise<{ customer: Customer | null; userErrors: CustomerUserError[] }> {
		const body = {
			query: CUSTOMER_CREATE,
			variables: {
				input
			}
		}

		Logger.log('[CustomerService] Criando nova conta de cliente:', input.email)

		const res = await ShopifyCaller.post(body)
		console.log(res)

		const { data } = res.data as { data: CustomerCreateResponse }

		const result = data.customerCreate

		if (result?.customer) {
			Logger.log('[CustomerService] Conta criada com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao criar conta:', result.customerUserErrors)
		}

		return {
			customer: result.customer,
			userErrors: result.customerUserErrors
		}
	}

	static async getCustomer(accessToken?: string): Promise<Customer | null> {
		const token = accessToken || (await CustomerService.getStoredAccessToken())

		if (!token) {
			Logger.log('[CustomerService] Nenhum token de acesso encontrado')
			return null
		}

		const body = {
			query: GET_CUSTOMER,
			variables: {
				customerAccessToken: token
			}
		}

		Logger.log('[CustomerService] Buscando dados do cliente')

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerResponse }

		if (data?.customer) {
			Logger.log('[CustomerService] Dados do cliente carregados com sucesso')
		} else {
			Logger.log('[CustomerService] Cliente não encontrado ou token inválido')
		}

		return data.customer
	}

	static async getCurrentCustomer(): Promise<Customer | null> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			return null
		}

		const isValid = await CustomerService.isTokenValid()

		if (!isValid) {
			const renewed = await CustomerService.renewAccessToken()
			if (!renewed) {
				await CustomerService.clearAccessToken()
				return null
			}
		}

		return CustomerService.getCustomer(token)
	}

	static async renewAccessToken(): Promise<CustomerAccessToken | null> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			Logger.log('[CustomerService] Nenhum token para renovar')
			return null
		}

		const body = {
			query: CUSTOMER_ACCESS_TOKEN_RENEW,
			variables: {
				customerAccessToken: token
			}
		}

		Logger.log('[CustomerService] Renovando token de acesso')

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerAccessTokenRenewResponse }

		const result = data.customerAccessTokenRenew

		if (result.customerAccessToken) {
			await CustomerService.saveAccessToken(result.customerAccessToken)
			Logger.log('[CustomerService] Token renovado com sucesso')
			return result.customerAccessToken
		}

		Logger.log('[CustomerService] Falha ao renovar token:', result.userErrors)
		return null
	}

	static async signOut(): Promise<boolean> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			return true
		}

		const body = {
			query: CUSTOMER_ACCESS_TOKEN_DELETE,
			variables: {
				customerAccessToken: token
			}
		}

		Logger.log('[CustomerService] Realizando logout do cliente')

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerAccessTokenDeleteResponse }

		await CustomerService.clearAccessToken()

		if (data.customerAccessTokenDelete.deletedAccessToken) {
			Logger.log('[CustomerService] Logout realizado com sucesso')
			return true
		}

		Logger.log('[CustomerService] Logout realizado (token limpo localmente)')
		return true
	}

	static async recoverPassword(email: string): Promise<{ success: boolean; userErrors: CustomerUserError[] }> {
		const body = {
			query: CUSTOMER_RECOVER,
			variables: {
				email
			}
		}

		Logger.log('[CustomerService] Solicitando recuperação de senha para:', email)

		const res = await ShopifyCaller.post(body)

		console.log(res)

		const { data } = res.data as { data: CustomerRecoverResponse }

		const result = data.customerRecover

		if (result?.customerUserErrors.length === 0) {
			Logger.log('[CustomerService] Email de recuperação enviado com sucesso')
			return { success: true, userErrors: [] }
		}

		Logger.log('[CustomerService] Falha ao solicitar recuperação:', result.customerUserErrors)
		return { success: false, userErrors: result.customerUserErrors }
	}

	static async resetPassword(
		customerId: string,
		input: CustomerResetInput
	): Promise<{
		customer: Customer | null
		accessToken: CustomerAccessToken | null
		userErrors: CustomerUserError[]
	}> {
		const body = {
			query: CUSTOMER_RESET,
			variables: {
				id: customerId,
				input
			}
		}

		Logger.log('[CustomerService] Resetando senha do cliente')

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerResetResponse }

		const result = data.customerReset

		if (result.customerAccessToken) {
			await CustomerService.saveAccessToken(result.customerAccessToken)
			Logger.log('[CustomerService] Senha resetada com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao resetar senha:', result.customerUserErrors)
		}

		return {
			customer: result.customer,
			accessToken: result.customerAccessToken,
			userErrors: result.customerUserErrors
		}
	}

	static async updateCustomer(input: CustomerUpdateInput): Promise<{
		customer: Customer | null
		accessToken: CustomerAccessToken | null
		userErrors: CustomerUserError[]
	}> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_UPDATE,
			variables: {
				customerAccessToken: token,
				customer: input
			}
		}

		Logger.log('[CustomerService] Atualizando dados do cliente')

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerUpdateResponse }

		const result = data.customerUpdate

		if (result.customerAccessToken) {
			await CustomerService.saveAccessToken(result.customerAccessToken)
			Logger.log('[CustomerService] Dados atualizados com sucesso')
		} else if (result.customerUserErrors.length > 0) {
			Logger.log('[CustomerService] Falha ao atualizar dados:', result.customerUserErrors)
		}

		return {
			customer: result.customer,
			accessToken: result.customerAccessToken,
			userErrors: result.customerUserErrors
		}
	}

	static async createAddress(
		address: MailingAddressInput
	): Promise<{ address: CustomerAddress | null; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_CREATE,
			variables: {
				customerAccessToken: token,
				address
			}
		}

		Logger.log('[CustomerService] Criando novo endereço')

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerAddressCreateResponse }

		const result = data.customerAddressCreate

		if (result.customerAddress) {
			Logger.log('[CustomerService] Endereço criado com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao criar endereço:', result.customerUserErrors)
		}

		return {
			address: result.customerAddress,
			userErrors: result.customerUserErrors
		}
	}

	static async updateAddress(
		addressId: string,
		address: MailingAddressInput
	): Promise<{ address: CustomerAddress | null; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_UPDATE,
			variables: {
				customerAccessToken: token,
				id: addressId,
				address
			}
		}

		Logger.log('[CustomerService] Atualizando endereço:', addressId)

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerAddressUpdateResponse }

		const result = data.customerAddressUpdate

		if (result.customerAddress) {
			Logger.log('[CustomerService] Endereço atualizado com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao atualizar endereço:', result.customerUserErrors)
		}

		return {
			address: result.customerAddress,
			userErrors: result.customerUserErrors
		}
	}

	static async deleteAddress(addressId: string): Promise<{ success: boolean; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_DELETE,
			variables: {
				customerAccessToken: token,
				id: addressId
			}
		}

		Logger.log('[CustomerService] Removendo endereço:', addressId)

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerAddressDeleteResponse }

		const result = data.customerAddressDelete

		if (result.deletedCustomerAddressId) {
			Logger.log('[CustomerService] Endereço removido com sucesso')
			return { success: true, userErrors: [] }
		}

		Logger.log('[CustomerService] Falha ao remover endereço:', result.customerUserErrors)
		return { success: false, userErrors: result.customerUserErrors }
	}

	static async setDefaultAddress(
		addressId: string
	): Promise<{ customer: Customer | null; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_DEFAULT_ADDRESS_UPDATE,
			variables: {
				customerAccessToken: token,
				addressId
			}
		}

		Logger.log('[CustomerService] Definindo endereço padrão:', addressId)

		const res = await ShopifyCaller.post(body)

		const { data } = res.data as { data: CustomerDefaultAddressUpdateResponse }

		const result = data.customerDefaultAddressUpdate

		if (result.customer) {
			Logger.log('[CustomerService] Endereço padrão definido com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao definir endereço padrão:', result.customerUserErrors)
		}

		return {
			customer: result.customer,
			userErrors: result.customerUserErrors
		}
	}

	static async isAuthenticated(): Promise<boolean> {
		const token = await CustomerService.getStoredAccessToken()

		if (!token) {
			return false
		}

		return CustomerService.isTokenValid()
	}

	static async isTokenValid(): Promise<boolean> {
		const expiresAt = await StorageService.getStorageItem(CustomerService.CUSTOMER_TOKEN_EXPIRES_AT_KEY)

		if (!expiresAt) {
			return false
		}

		const expirationDate = new Date(expiresAt)
		const now = new Date()

		return expirationDate > now
	}

	static async saveAccessToken(accessToken: CustomerAccessToken): Promise<void> {
		await StorageService.setStorageItem(CustomerService.CUSTOMER_ACCESS_TOKEN_KEY, accessToken.accessToken)
		await StorageService.setStorageItem(CustomerService.CUSTOMER_TOKEN_EXPIRES_AT_KEY, accessToken.expiresAt)
	}

	static async getStoredAccessToken(): Promise<string | null> {
		return StorageService.getStorageItem(CustomerService.CUSTOMER_ACCESS_TOKEN_KEY)
	}

	static async clearAccessToken(): Promise<void> {
		await StorageService.removeItem(CustomerService.CUSTOMER_ACCESS_TOKEN_KEY)
		await StorageService.removeItem(CustomerService.CUSTOMER_TOKEN_EXPIRES_AT_KEY)
	}
}
