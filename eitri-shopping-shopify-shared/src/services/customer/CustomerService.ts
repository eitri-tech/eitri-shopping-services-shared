import {
	Customer,
	CustomerUserError,
	CustomerUpdateInput,
	CustomerAddressInput,
	CustomerResponse,
	CustomerUpdateResponse,
	CustomerAddressCreateResponse,
	CustomerAddressUpdateResponse,
	CustomerAddressDeleteResponse,
	CustomerAddress,
	CustomerApiError,
	CustomerGraphQLError,
	CustomerOrderEdge,
	CustomerOrdersPageInfo,
	CustomerOrdersResponse
} from '../../models/Customer'
import ShopifyCaller from '../_helpers/ShopifyCaller'
import {
	GET_CUSTOMER,
	GET_CUSTOMER_ORDERS,
	CUSTOMER_UPDATE,
	CUSTOMER_ADDRESS_CREATE,
	CUSTOMER_ADDRESS_UPDATE,
	CUSTOMER_ADDRESS_DELETE
} from '../../graphql/queries/customer.queries.gql'
import Eitri from 'eitri-bifrost'
import RemoteConfig from '../RemoteConfig'
import Logger from '../_helpers/Logger'
import { AuthService } from './CustomerAuth'

export class CustomerService {
	static auth = AuthService

	private static readonly STATUS_MESSAGES: Record<number, { code: string; message: string }> = {
		400: { code: 'BAD_REQUEST', message: 'Requisição inválida. Verifique os parâmetros enviados.' },
		401: { code: 'UNAUTHORIZED', message: 'Credenciais inválidas ou ausentes.' },
		402: { code: 'PAYMENT_REQUIRED', message: 'Loja congelada por pendência de pagamento.' },
		403: { code: 'FORBIDDEN', message: 'Acesso negado à loja.' },
		404: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' },
		423: { code: 'LOCKED', message: 'Loja temporariamente indisponível.' }
	}

	private static handleResponse(res: any): any {
		const status = res?.status || res?.response?.status

		if (status && status >= 400) {
			const statusInfo = CustomerService.STATUS_MESSAGES[status]

			if (statusInfo) {
				Logger.log(`[CustomerService] Erro ${status}: ${statusInfo.message}`)
				throw new CustomerApiError(status, statusInfo.code, statusInfo.message)
			}

			if (status >= 500) {
				Logger.log(`[CustomerService] Erro interno do servidor (${status})`)
				throw new CustomerApiError(status, 'INTERNAL_SERVER_ERROR', 'Erro interno do Shopify. Tente novamente mais tarde.')
			}

			throw new CustomerApiError(status, 'UNKNOWN_ERROR', `Erro inesperado: ${status}`)
		}

		const responseData = res?.data?.data ?? res?.data
		const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData

		const graphqlErrors: CustomerGraphQLError[] = parsed?.errors
		if (graphqlErrors?.length) {
			const firstError = graphqlErrors[0]
			const code = firstError.extensions?.code || 'GRAPHQL_ERROR'
			const message = firstError.message || 'Erro na consulta GraphQL'

			Logger.log(`[CustomerService] GraphQL Error [${code}]: ${message}`)
			throw new CustomerApiError(200, code, message, graphqlErrors)
		}

		return parsed
	}

	private static async discoverCustomerApiUrl(): Promise<string> {
		let host = RemoteConfig.getContent('providerInfo.host') || ''

		if (!host) {
			throw new Error('Nenhum host definido para essa loja')
		}

		host = host.replace(/^https?:\/\//, '').replace(/^www\./, '')

		const wellKnownUrl = `https://${host}/.well-known/customer-account-api`
		const response = await Eitri.http.get(wellKnownUrl)
		const { graphql_api } = response.data

		if (!graphql_api) {
			throw new Error('graphql_api não encontrado no .well-known/customer-account-api')
		}

		return graphql_api
	}

	static async getCustomer(): Promise<Customer | null> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			Logger.log('[CustomerService] Nenhum token de acesso encontrado')
			return null
		}

		const body = {
			query: GET_CUSTOMER
		}

		Logger.log('[CustomerService] Buscando dados do cliente')

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const { customer } = (parsed.data ?? parsed) as CustomerResponse

		if (customer) {
			Logger.log('[CustomerService] Dados do cliente carregados com sucesso')
		} else {
			Logger.log('[CustomerService] Cliente não encontrado ou token inválido')
		}

		return customer
	}

	static async getCurrentCustomer(): Promise<Customer | null> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			return null
		}

		return CustomerService.getCustomer()
	}

	static async getOrders(params?: {
		first?: number
		after?: string
		sortKey?: string
		reverse?: boolean
	}): Promise<{
		orders: CustomerOrderEdge[]
		pageInfo: CustomerOrdersPageInfo
	}> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			Logger.log('[CustomerService] Nenhum token de acesso encontrado')
			return { orders: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
		}

		const body = {
			query: GET_CUSTOMER_ORDERS,
			variables: {
				first: params?.first ?? 10,
				after: params?.after ?? null,
				sortKey: params?.sortKey ?? 'PROCESSED_AT',
				reverse: params?.reverse ?? true
			}
		}

		Logger.log('[CustomerService] Buscando pedidos do cliente')

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const { customer } = (parsed.data ?? parsed) as CustomerOrdersResponse

		if (!customer?.orders) {
			Logger.log('[CustomerService] Nenhum pedido encontrado')
			return { orders: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } }
		}

		Logger.log(`[CustomerService] ${customer.orders.edges.length} pedido(s) carregado(s)`)

		return {
			orders: customer.orders.edges,
			pageInfo: customer.orders.pageInfo
		}
	}

	static async updateCustomer(input: CustomerUpdateInput): Promise<{
		customer: Customer | null
		userErrors: CustomerUserError[]
	}> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_UPDATE,
			variables: {
				input
			}
		}

		Logger.log('[CustomerService] Atualizando dados do cliente')

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const result = ((parsed.data ?? parsed) as CustomerUpdateResponse).customerUpdate

		if (result.userErrors.length > 0) {
			Logger.log('[CustomerService] Falha ao atualizar dados:', result.userErrors)
		} else {
			Logger.log('[CustomerService] Dados atualizados com sucesso')
		}

		return {
			customer: result.customer,
			userErrors: result.userErrors
		}
	}

	static async createAddress(
		address: CustomerAddressInput,
		defaultAddress?: boolean
	): Promise<{ address: CustomerAddress | null; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_CREATE,
			variables: {
				address,
				defaultAddress: defaultAddress ?? false
			}
		}

		Logger.log('[CustomerService] Criando novo endereço')

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const result = ((parsed.data ?? parsed) as CustomerAddressCreateResponse).customerAddressCreate

		if (result.customerAddress) {
			Logger.log('[CustomerService] Endereço criado com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao criar endereço:', result.userErrors)
		}

		return {
			address: result.customerAddress,
			userErrors: result.userErrors
		}
	}

	static async updateAddress(
		addressId: string,
		address: CustomerAddressInput,
		defaultAddress?: boolean
	): Promise<{ address: CustomerAddress | null; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_UPDATE,
			variables: {
				addressId,
				address,
				defaultAddress: defaultAddress ?? null
			}
		}

		Logger.log('[CustomerService] Atualizando endereço:', addressId)

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const result = ((parsed.data ?? parsed) as CustomerAddressUpdateResponse).customerAddressUpdate

		if (result.customerAddress) {
			Logger.log('[CustomerService] Endereço atualizado com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao atualizar endereço:', result.userErrors)
		}

		return {
			address: result.customerAddress,
			userErrors: result.userErrors
		}
	}

	static async deleteAddress(addressId: string): Promise<{ success: boolean; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_DELETE,
			variables: {
				addressId
			}
		}

		Logger.log('[CustomerService] Removendo endereço:', addressId)

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const result = ((parsed.data ?? parsed) as CustomerAddressDeleteResponse).customerAddressDelete

		if (result.deletedAddressId) {
			Logger.log('[CustomerService] Endereço removido com sucesso')
			return { success: true, userErrors: [] }
		}

		Logger.log('[CustomerService] Falha ao remover endereço:', result.userErrors)
		return { success: false, userErrors: result.userErrors }
	}

	static async setDefaultAddress(
		addressId: string
	): Promise<{ address: CustomerAddress | null; userErrors: CustomerUserError[] }> {
		const token = await CustomerService.auth.getAccessToken()

		if (!token) {
			throw new Error('Nenhum token de acesso encontrado')
		}

		const body = {
			query: CUSTOMER_ADDRESS_UPDATE,
			variables: {
				addressId,
				defaultAddress: true
			}
		}

		Logger.log('[CustomerService] Definindo endereço padrão:', addressId)

		const customerApiUrl = await CustomerService.discoverCustomerApiUrl()

		const res = await ShopifyCaller.post(
			body,
			{
				headers: {
					Authorization: token
				}
			},
			customerApiUrl
		)

		const parsed = CustomerService.handleResponse(res)
		const result = ((parsed.data ?? parsed) as CustomerAddressUpdateResponse).customerAddressUpdate

		if (result.customerAddress) {
			Logger.log('[CustomerService] Endereço padrão definido com sucesso')
		} else {
			Logger.log('[CustomerService] Falha ao definir endereço padrão:', result.userErrors)
		}

		return {
			address: result.customerAddress,
			userErrors: result.userErrors
		}
	}

	static async isAuthenticated(): Promise<boolean> {
		return CustomerService.auth.isAuthenticated()
	}
}
