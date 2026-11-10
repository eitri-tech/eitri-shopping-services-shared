import Eitri from 'eitri-bifrost'
import { CmsError } from '../../errors/CmsError'
import type { CmsContent, CmsListOptions } from '../../models/Cms'
import { getApplicationId, getConfig } from '../_helpers/config'
import { httpStatusOf, isObject } from '../_helpers/http'

const queryOf = (options?: CmsListOptions): string => {
	const params: string[] = []
	if (options?.full) params.push('full=true')
	for (const [field, value] of Object.entries(options?.filter ?? {})) {
		if (typeof value === 'string' && value) {
			params.push(`${encodeURIComponent(`filter[${field}]`)}=${encodeURIComponent(value)}`)
		}
	}
	return params.length ? `?${params.join('&')}` : ''
}

/**
 * Conteúdo publicado da aplicação, por content-type. Lança `CmsError` em vez de devolver vazio: o app
 * distingue erro de "nada publicado" e oferece retry. O tipo genérico não é validado: normalize o payload.
 */
export default class CmsService {
	private static async get(path: string): Promise<unknown> {
		const appId = getApplicationId()
		if (!appId) throw new CmsError('NO_APP_ID', 'applicationId indisponível: chame Dnvb.configure ou rode dentro do Eitri')
		const url = `${getConfig().cmsUrl}/contents/app/${encodeURIComponent(appId)}${path}`
		try {
			const response = await Eitri.http.get(url)
			return response?.data
		} catch (e) {
			const status = httpStatusOf(e)
			if (status === 404) throw new CmsError('NOT_FOUND', `CMS sem conteúdo em ${url}`, status)
			console.warn('[dnvb-cms] falha ao consultar', url, e)
			throw new CmsError('NETWORK_ERROR', 'Não foi possível carregar o conteúdo', status)
		}
	}

	static async listContents<T extends CmsContent = CmsContent>(type: string, options?: CmsListOptions): Promise<T[]> {
		if (!type) throw new CmsError('NOT_FOUND', 'content-type vazio')
		const raw = await CmsService.get(`/${encodeURIComponent(type)}${queryOf(options)}`)
		return (isObject(raw) && Array.isArray(raw.docs) ? raw.docs : []).filter(isObject) as T[]
	}

	static async getContent<T extends CmsContent = CmsContent>(type: string, slug: string): Promise<T> {
		if (!type || !slug) throw new CmsError('NOT_FOUND', 'content-type ou slug vazio')
		const raw = await CmsService.get(`/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`)
		if (!isObject(raw)) throw new CmsError('INVALID_PAYLOAD', `"${type}/${slug}" com payload inválido`)
		return raw as T
	}
}
