import { diagLog } from './weni/env/diag'

/**
 * ProductCache
 *
 * Guarda os produtos do catálogo já resolvidos a partir do skuId dos cards do
 * carrossel, pra que tocar num card abra a PDP com o produto em mãos — mesmo
 * comportamento de abrir um produto pela vitrine da Home, onde o objeto inteiro
 * já viaja no initParams e a PDP não precisa buscar nada antes de pintar.
 *
 * Quem sabe consultar o catálogo é o app host (o `Vtex` de dentro de um Eitri-App
 * compartilhado não é configurado pelo host), então ele injeta a função via prop
 * `resolveProduct` do <WeniChat/>. Sem ela nada aqui roda e o fluxo cai no
 * caminho antigo: a própria PDP resolve pelo skuId.
 */

// skuId -> produto resolvido | Promise em andamento
const cache = new Map()
const MAX_ENTRIES = 60

function remember(skuId, value) {
	if (cache.size >= MAX_ENTRIES) {
		const oldest = cache.keys().next().value
		if (oldest !== undefined) cache.delete(oldest)
	}
	cache.set(skuId, value)
}

/**
 * Produto já resolvido para este SKU, se houver. Não dispara busca nem espera:
 * é o caminho síncrono do toque quando o prefetch já terminou.
 * @param {string} skuId
 * @returns {object|null}
 */
export function getCachedProduct(skuId) {
	const entry = cache.get(String(skuId))
	return entry && typeof entry.then !== 'function' ? entry : null
}

/**
 * Resolve o produto do SKU, reaproveitando o prefetch em andamento ou concluído.
 * @param {string} skuId
 * @param {(skuId: string) => Promise<object>} resolveProduct injetado pelo host
 * @returns {Promise<object|null>}
 */
export function resolveProductBySku(skuId, resolveProduct) {
	if (!skuId || typeof resolveProduct !== 'function') return Promise.resolve(null)

	const key = String(skuId)
	const entry = cache.get(key)
	if (entry) return typeof entry.then === 'function' ? entry : Promise.resolve(entry)

	const pending = Promise.resolve()
		.then(() => resolveProduct(key))
		.then(product => {
			if (product) {
				remember(key, product)
				return product
			}
			// Sem resultado: não guarda o nulo, deixa tentar de novo no toque.
			cache.delete(key)
			return null
		})
		.catch(error => {
			cache.delete(key)
			diagLog('[product] falha ao resolver sku', key, error?.message || String(error))
			return null
		})

	remember(key, pending)
	return pending
}

/**
 * Aquece o cache com os SKUs de um carrossel recém-renderizado. Dispara e
 * esquece — o resultado é lido depois pelo toque.
 * @param {Array<string>} skuIds
 * @param {(skuId: string) => Promise<object>} resolveProduct
 */
export function prefetchProducts(skuIds, resolveProduct) {
	if (!Array.isArray(skuIds) || typeof resolveProduct !== 'function') return

	skuIds.filter(Boolean).forEach(skuId => {
		if (cache.has(String(skuId))) return
		resolveProductBySku(skuId, resolveProduct)
	})
}
