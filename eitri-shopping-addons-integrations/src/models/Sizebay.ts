export type SizebayDevice = 'DESKTOP' | 'MOBILE' | 'TABLET' | 'APP'

export interface SizebayServiceConfig {
	/** Tenant da loja na Sizebay. Sem isso, `getSizeBayUrls` sempre retorna `null`. */
	tenantId: string
	country: string
	/** `'APP'` é o valor esperado para uma Eitri-App rodando dentro do WebView nativo. */
	device: SizebayDevice
	/**
	 * `false` (default) — comportamento atual/corrigido: host do VFR escolhido pelo tipo de
	 * produto (calçado usa um host dedicado), tabela de medidas em host próprio, sessão obtida de
	 * `GET /api/me/session-id` e cacheada via `Eitri.storage`.
	 *
	 * `true` — comportamento legado usado pelos apps mais antigos do `shared-services`: VFR e
	 * tabela de medidas sempre no host `V4`, sessão obtida lendo o header `Set-Cookie` da resposta
	 * de `/plugin/my-product-id` (sem cache). Existe só para compatibilidade com integrações
	 * antigas — não use em apps novos.
	 */
	legacyUrls: boolean
	/** Chave usada em `Eitri.storage` para cachear o `sid` da sessão (comportamento não-legado). */
	sessionStorageKey: string
}

export interface SizeBayUrls {
	/** Ausente quando o produto é um acessório — nesse caso só a tabela de medidas se aplica. */
	vfrUrl?: string
	chartUrl: string
}

export interface GetSizeBayUrlsInput {
	/**
	 * URL completa e pública do produto na loja (ex.: `${storeHost}/${linkText}/p` na VTEX).
	 * Montar essa URL é responsabilidade do app consumidor — este pacote não conhece VTEX/Wake/Shopify.
	 */
	permalink: string
	/** Idioma no formato aceito pela Sizebay (`'br'` ou `'en'`). Default `'br'`. */
	lang?: string
	/** URL da imagem do produto/SKU selecionado, se disponível. */
	productImage?: string
	/** Tamanhos em estoque, separados por vírgula (ex.: `'36,37,38'`). Calcular isso é responsabilidade do app. */
	sizesInStock?: string
}

/** Resposta de `GET /plugin/my-product-id`. */
export interface SizebayProductInfo {
	id?: string
	accessory?: boolean
	/**
	 * Vem `false` mesmo para produtos que são calçado — comportamento observado direto na API,
	 * não documentado. `clothesType` é o que reflete o tipo real (ex.: `"SHOE_ACCESSORY"`), então
	 * o serviço confere os dois.
	 */
	shoe?: boolean
	clothesType?: string
}
