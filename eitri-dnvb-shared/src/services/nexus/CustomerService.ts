import { NexusError } from '../../errors/NexusError'
import type { NexusCustomer } from '../../models/Nexus'
import { isObject } from '../_helpers/http'
import NexusCaller from './NexusCaller'

const ME = '/customers/me'

const normalizeCustomer = (raw: unknown): NexusCustomer => {
	if (!isObject(raw) || typeof raw.customerId !== 'string') {
		throw new NexusError('INVALID_PAYLOAD', 'customers/me com payload inválido')
	}
	return {
		customerId: raw.customerId,
		applicationId: typeof raw.applicationId === 'string' ? raw.applicationId : '',
		externalCustomerId: typeof raw.externalCustomerId === 'string' ? raw.externalCustomerId : null,
		data: isObject(raw.data) ? raw.data : {}
	}
}

export default class CustomerService {
	static async me(): Promise<NexusCustomer> {
		return normalizeCustomer(await NexusCaller.request('get', ME))
	}

	/**
	 * Liga a instalação ao customer da conta logada; o Nexus confirma o token com a plataforma de commerce
	 * (hoje só Shopify, pela Customer Account API; as demais respondem `UNSUPPORTED_PLATFORM`). O anônimo
	 * anterior fica para trás sem merge, então chame antes de salvar dados da conta.
	 */
	static async link(customerToken: string): Promise<NexusCustomer> {
		const token = typeof customerToken === 'string' ? customerToken.trim() : ''
		if (!token) throw new NexusError('INVALID_PAYLOAD', 'customerToken vazio')
		return normalizeCustomer(await NexusCaller.requestOnce('post', `${ME}/link`, { customerToken: token }))
	}

	/** `externalCustomerId` no corpo responde 400: o id só entra pelo `link`. */
	static async update(data: Record<string, unknown>): Promise<NexusCustomer> {
		if (!isObject(data)) throw new NexusError('INVALID_PAYLOAD', 'data precisa ser um objeto')
		return normalizeCustomer(await NexusCaller.request('put', ME, { data }))
	}
}
