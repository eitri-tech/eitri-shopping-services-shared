import Eitri from 'eitri-bifrost'
import { NexusError } from '../../errors/NexusError'
import { getConfig } from '../_helpers/config'
import { httpStatusOf } from '../_helpers/http'
import NexusSession from './NexusSession'

export type NexusMethod = 'get' | 'delete' | 'put' | 'post' | 'patch'

const send = async (method: NexusMethod, path: string, token: string, body?: unknown): Promise<any> => {
	const url = `${getConfig().nexusUrl}${path}`
	const config = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
	const response =
		method === 'get' || method === 'delete'
			? await Eitri.http[method](url, config)
			: await Eitri.http[method](url, body ?? {}, config)
	return response?.data
}

const toError = (e: unknown, path: string): NexusError => {
	const status = httpStatusOf(e)
	if (status === 401) return new NexusError('UNAUTHORIZED', `Nexus recusou o token em ${path}`, status)
	if (status === 404) return new NexusError('NOT_FOUND', `Nexus sem o item em ${path}`, status)
	if (status === 409) {
		return new NexusError('LIMIT_REACHED', `Conflito em ${path}: limite de coleções ou vínculo concorrente`, status)
	}
	if (status === 400) return new NexusError('INVALID_PAYLOAD', `Nexus rejeitou o payload em ${path}`, status)
	if (status === 501) {
		return new NexusError('UNSUPPORTED_PLATFORM', `Nexus não suporta ${path} na plataforma desta aplicação`, status)
	}
	console.warn('[nexus] falha em', path, e)
	return new NexusError('NETWORK_ERROR', 'Não foi possível falar com o Nexus', status)
}

export default class NexusCaller {
	/**
	 * Em 401 (token desconhecido no backend) registra uma nova instalação e tenta de novo uma vez.
	 * O novo register cria um customer vazio: os dados do anterior ficam inacessíveis.
	 */
	static async request(method: NexusMethod, path: string, body?: unknown): Promise<any> {
		const session = await NexusSession.ensure()
		try {
			return await send(method, path, session.token, body)
		} catch (e) {
			if (httpStatusOf(e) !== 401) throw toError(e, path)
			console.warn('[nexus] token recusado, registrando nova instalação', session.installationId)
			await NexusSession.invalidate(session.token)
			const fresh = await NexusSession.ensure()
			try {
				return await send(method, path, fresh.token, body)
			} catch (retryError) {
				throw toError(retryError, path)
			}
		}
	}

	/**
	 * Não registra de novo em 401: onde o 401 pode vir de uma credencial de terceiros (o token da
	 * plataforma no `/customers/me/link`), o retry do `request` jogaria fora o customer.
	 */
	static async requestOnce(method: NexusMethod, path: string, body?: unknown): Promise<any> {
		const session = await NexusSession.ensure()
		try {
			return await send(method, path, session.token, body)
		} catch (e) {
			throw toError(e, path)
		}
	}

	/**
	 * Nunca registra: para chamadas que vários eitri-apps fazem ao mesmo tempo (tracking), em que um
	 * register em cada WebView criaria customers duplicados.
	 */
	static async requestIfRegistered(method: NexusMethod, path: string, body?: unknown): Promise<any> {
		const session = await NexusSession.get()
		if (!session) throw new NexusError('NO_SESSION', `Sem sessão do Nexus para ${path}`)
		try {
			return await send(method, path, session.token, body)
		} catch (e) {
			if (httpStatusOf(e) === 401) await NexusSession.invalidate(session.token)
			throw toError(e, path)
		}
	}
}
