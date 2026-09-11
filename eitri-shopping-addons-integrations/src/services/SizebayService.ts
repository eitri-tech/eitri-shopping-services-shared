import Eitri from 'eitri-bifrost'

import type {
	GetSizeBayUrlsInput,
	SizeBayUrls,
	SizebayDevice,
	SizebayProductInfo,
	SizebayServiceConfig
} from '../models/Sizebay'

// URLs por https://docs.sizebay.com/size-and-fit-implementation/service-implementation-api
const SESSION_ID_URL = 'https://vfr-v3-production.sizebay.technology/api/me/session-id'
const PRODUCT_ID_URL = 'https://vfr-v3-production.sizebay.technology/plugin/my-product-id'
// Calçados usam um host de VFR dedicado; os demais produtos usam o host V4 legado.
const VFR_SHOE_URL = 'https://new-shoe-experience.sizebay.technology/'
const VFR_NON_SHOE_URL = 'https://vfr-v3-production.sizebay.technology/V4/'
const SIZE_CHART_URL = 'https://measurements-table.sizebay.technology/'

export const DEVICES: Record<SizebayDevice, SizebayDevice> = {
	DESKTOP: 'DESKTOP',
	MOBILE: 'MOBILE',
	TABLET: 'TABLET',
	APP: 'APP'
}

const SID_COOKIE_REGEX = /([^=;\s]*session[^=;\s]*)=([^;,\s]+)/i

let config: SizebayServiceConfig = {
	tenantId: '',
	country: 'BR',
	device: DEVICES.APP,
	legacyUrls: false,
	sessionStorageKey: 'SIZEBAY_SESSION_ID_V4'
}

const getHeaders = (tenantId: string) => ({
	'x-szb-country': config.country,
	'x-szb-device': config.device,
	'x-szb-tenant-id': tenantId
})

/** Sessão via `GET /api/me/session-id` (comportamento atual): o `sid` vem no corpo e é cacheado em `Eitri.storage`. */
const getSessionId = async (tenantId: string): Promise<string | null> => {
	try {
		const cached = await Eitri.storage.getItemJson(config.sessionStorageKey)
		if (typeof cached === 'string' && cached) return cached
	} catch {
		// sem cache — segue pra buscar uma nova sessão
	}

	const res = await Eitri.http.get(SESSION_ID_URL, { headers: getHeaders(tenantId) })
	const sid = typeof res?.data === 'string' ? res.data : null

	if (sid) {
		try {
			await Eitri.storage.setItemJson(config.sessionStorageKey, sid)
		} catch {
			// falha ao persistir não deve bloquear o fluxo
		}
	}

	return sid
}

const getProductInfo = async (
	permalink: string,
	sid: string,
	tenantId: string
): Promise<SizebayProductInfo | null> => {
	const url = new URL(PRODUCT_ID_URL)
	url.searchParams.set('sid', sid)
	url.searchParams.set('permalink', permalink)

	const res = await Eitri.http.get(url.href, { headers: getHeaders(tenantId) })
	return res?.data ?? null
}

const extractSidFromSetCookie = (headers: Record<string, unknown> | undefined): string | null => {
	const setCookie = headers?.['set-cookie'] ?? headers?.['Set-Cookie']
	const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie
	if (typeof cookieHeader !== 'string') return null

	return cookieHeader.match(SID_COOKIE_REGEX)?.[2] ?? null
}

/**
 * Sessão via `Set-Cookie` de `/plugin/my-product-id` (comportamento legado): nenhum `sid` é
 * enviado, o servidor cria um e devolve no cookie da resposta. Sem cache — cada chamada gera uma
 * sessão nova quando não há cookie jar real reenviando o valor (é o caso do `Eitri.http`).
 */
const getLegacyProductInfo = async (
	permalink: string,
	tenantId: string
): Promise<{ productInfo: SizebayProductInfo | null; sid: string | null }> => {
	const url = new URL(PRODUCT_ID_URL)
	url.searchParams.set('permalink', permalink)

	const res = await Eitri.http.get(url.href, { headers: getHeaders(tenantId) })
	const sid = extractSidFromSetCookie(res?.headers)

	return { productInfo: res?.data ?? null, sid }
}

const translateLang = (lang?: string): string => {
	if (!lang || lang === 'pt-BR') return 'br'
	return 'en'
}

export default class SizebayService {
	static DEVICES = DEVICES

	/**
	 * Injeta o que é específico da loja: tenant na Sizebay, país/device e a escolha entre a
	 * experiência atual e a legada. Sem `tenantId`, `getSizeBayUrls` sempre retorna `null`.
	 */
	static configure(options: Partial<SizebayServiceConfig>): void {
		config = { ...config, ...options }
	}

	static getConfig(): SizebayServiceConfig {
		return config
	}

	/**
	 * Monta as URLs do provador virtual (VFR) e da tabela de medidas para um produto.
	 *
	 * Fluxo: obtém/reaproveita uma sessão (`sid`), busca o `id` do produto na Sizebay a partir do
	 * `permalink`, e então monta as duas URLs. Retorna `null` sempre que faltar `tenantId`,
	 * `permalink`, sessão ou `id` do produto — nunca lança.
	 *
	 * Quando o produto é um acessório (`accessory: true` na resposta da Sizebay), só a tabela de
	 * medidas se aplica — `vfrUrl` não é preenchido, por regra da própria Sizebay.
	 */
	static async getSizeBayUrls(input: GetSizeBayUrlsInput): Promise<SizeBayUrls | null> {
		const { tenantId, legacyUrls, device } = config
		const permalink = input?.permalink
		const lang = translateLang(input?.lang)

		if (!tenantId || !permalink) return null

		try {
			let sid: string | null
			let productInfo: SizebayProductInfo | null

			if (legacyUrls) {
				const legacy = await getLegacyProductInfo(permalink, tenantId)
				sid = legacy.sid
				productInfo = legacy.productInfo
			} else {
				sid = await getSessionId(tenantId)
				productInfo = sid ? await getProductInfo(permalink, sid, tenantId) : null
			}

			if (!sid || !productInfo?.id) return null

			const buildUrl = (baseUrl: string, mode?: 'vfr' | 'chart'): string => {
				const url = new URL(baseUrl)
				url.searchParams.set('id', productInfo.id as string)
				url.searchParams.set('sid', sid as string)
				url.searchParams.set('tenantId', tenantId)
				url.searchParams.set('lang', lang)
				url.searchParams.set('watchOpeningEvents', 'true')
				url.searchParams.set('device', device)
				url.searchParams.set('disableCloseApp', 'true')
				if (mode) url.searchParams.set('mode', mode)
				if (input?.productImage) url.searchParams.set('pageProductImg', input.productImage)
				if (input?.sizesInStock) url.searchParams.set('sizesInStock', input.sizesInStock)
				return url.href
			}

			const chartUrl = legacyUrls ? buildUrl(VFR_NON_SHOE_URL, 'chart') : buildUrl(SIZE_CHART_URL)

			if (productInfo.accessory) return { chartUrl }

			const isShoe = productInfo.shoe || productInfo.clothesType?.toUpperCase().includes('SHOE')
			const vfrBaseUrl = !legacyUrls && isShoe ? VFR_SHOE_URL : VFR_NON_SHOE_URL
			const vfrUrl = new URL(buildUrl(vfrBaseUrl, 'vfr'))
			if (!legacyUrls && isShoe) vfrUrl.searchParams.set('brandsComparison', 'true')

			return { vfrUrl: vfrUrl.href, chartUrl }
		} catch (e) {
			console.error('[SizebayService] Falha ao montar URLs da Sizebay', e)
			return null
		}
	}
}
