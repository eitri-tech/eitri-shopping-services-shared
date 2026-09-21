import Eitri from 'eitri-bifrost'

import { getChatConfig } from '../config/ChatConfig'
import { getCachedProduct, resolveProductBySku } from './ProductCache'
import { diagLog } from './weni/env/diag'

/**
 * LinkRouter
 *
 * Analisa URLs que chegam nas mensagens do bot (texto, cta_message, product_url)
 * e decide a melhor experiência: abrir a tela NATIVA correspondente do app
 * (PDP, carrinho, checkout, detalhe de pedido) via Eitri.nativeNavigation /
 * Eitri.navigation, ou cair no browser in-app para links não reconhecidos.
 *
 * Intents reconhecidos:
 *   product   -> { slug }      URL de PDP VTEX (caminho terminando em /p)
 *                { skuId }    card do carrossel sem URL (ver openProductItem)
 *   cart      -> {}            /checkout#/cart ou /cart
 *   checkout  -> {}            /checkout (demais passos)
 *   order     -> { orderId }   /account...orders/{id} (hash ou path)
 *   orderList -> {}            /account...orders sem id
 *   external  -> { url }       qualquer outro link
 *
 * Customização:
 *   - config.links.rules (publicável via remoteConfig): regex avaliadas antes
 *     das regras padrão; o 1º grupo de captura vira o parâmetro do intent.
 *   - rules extras programáticas via classifyLink(url, { extraRules }).
 *   - openLink aceita onNavigate(intent): retorne true para interceptar tudo.
 */

const ORDER_ID_PATTERN = /orders\/([A-Za-z0-9._-]+)/i
const PDP_PATH_PATTERN = /^\/(.+)\/p\/?$/i

function safeParseUrl(url) {
	try {
		return new URL(url)
	} catch (_) {
		try {
			return new URL(`https://${url}`)
		} catch (_) {
			return null
		}
	}
}

/**
 * Aplica as regras configuráveis (strings regex vindas do remoteConfig ou
 * funções/regex passadas programaticamente).
 * Regra declarativa: { pattern: string|RegExp, intent: string, flags?: string }
 * Regra função: (url) => null | { intent, ...params }
 */
function applyRules(url, rules) {
	if (!Array.isArray(rules)) return null
	for (const rule of rules) {
		if (!rule) continue
		if (typeof rule === 'function') {
			const result = rule(url)
			if (result && result.intent) return result
			continue
		}
		if (!rule.pattern || !rule.intent) continue
		let regex = rule.pattern
		if (typeof regex === 'string') {
			try {
				regex = new RegExp(regex, rule.flags || 'i')
			} catch (_) {
				continue
			}
		}
		const match = url.match(regex)
		if (match) {
			const param = match[1]
			if (rule.intent === 'product') return { intent: 'product', slug: param }
			if (rule.intent === 'order') return { intent: 'order', orderId: param }
			return { intent: rule.intent, url }
		}
	}
	return null
}

/**
 * Classifica uma URL em um intent de navegação.
 * @param {string} url
 * @param {{ config?: object, extraRules?: Array }} [options]
 * @returns {{ intent: string, url: string, slug?: string, orderId?: string }}
 */
export function classifyLink(url, options = {}) {
	const config = options.config || getChatConfig()
	const external = { intent: 'external', url }
	if (!url || typeof url !== 'string') return external

	// 1. Regras programáticas do host, depois as declarativas da config.
	const custom = applyRules(url, options.extraRules) || applyRules(url, config?.links?.rules)
	if (custom) return { url, ...custom }

	const parsed = safeParseUrl(url)
	if (!parsed) return external

	const path = parsed.pathname || '/'
	const hash = parsed.hash || ''
	const full = path + hash

	// 2. Pedido: /account#/orders/{id}, /account/orders/{id}, /_secure/account#/orders/{id}
	if (/account/i.test(full) || /orders\//i.test(full)) {
		const orderMatch = full.match(ORDER_ID_PATTERN)
		if (orderMatch) return { intent: 'order', orderId: orderMatch[1], url }
		if (/orders\/?$/i.test(full)) return { intent: 'orderList', url }
	}

	// 3. Carrinho: /checkout#/cart ou /cart
	if (/^\/checkout\/?$/i.test(path) && /#\/cart/i.test(hash)) return { intent: 'cart', url }
	if (/^\/cart\/?$/i.test(path)) return { intent: 'cart', url }

	// 4. Checkout (demais passos: #/shipping, #/payment, /checkout/...)
	if (/^\/checkout(\/|$)/i.test(path)) return { intent: 'checkout', url }

	// 5. PDP VTEX: caminho terminando em /p
	const pdpMatch = path.match(PDP_PATH_PATTERN)
	if (pdpMatch) return { intent: 'product', slug: decodeURIComponent(pdpMatch[1]), url }

	return external
}

/**
 * Abre a URL no browser (in-app por padrão, conforme config.links.openInAppBrowser).
 */
export function openInBrowser(url, config) {
	const cfg = config || getChatConfig()
	try {
		Eitri.openBrowser({ url, inApp: cfg?.links?.openInAppBrowser !== false })
	} catch (_) {
		/* noop */
	}
}

/**
 * Executa a navegação de um intent já classificado.
 * @param {{intent: string, url?: string, slug?: string, orderId?: string}} intent
 * @param {object} [config]
 */
export function navigateToIntent(intent, config) {
	const cfg = config || getChatConfig()
	const links = cfg.links || {}
	diagLog('[nav]', intent.intent, intent.slug || intent.skuId || intent.orderId || intent.url || '')
	try {
		switch (intent.intent) {
			case 'product': {
				const initParams = {}
				if (intent.slug) initParams.slug = intent.slug
				if (intent.skuId) initParams.skuId = intent.skuId
				if (intent.sellerId) initParams.sellerId = intent.sellerId
				if (intent.product) initParams.product = intent.product

				Eitri.nativeNavigation.open({ slug: links.pdpSlug || 'pdp', initParams })
				return true
			}
			case 'cart':
				Eitri.nativeNavigation.open({ slug: links.cartSlug || 'cart' })
				return true
			case 'checkout':
				Eitri.nativeNavigation.open({ slug: links.checkoutSlug || 'checkout' })
				return true
			case 'order':
				if (links.orderTarget === 'native') {
					// Chat hospedado fora do app de conta: abre o app de conta com a
					// rota como deep link (o Home do account resolve startParams.route).
					Eitri.nativeNavigation.open({
						slug: links.accountSlug || 'account',
						initParams: { route: links.orderDetailsRoute || '/OrderDetails', orderId: intent.orderId }
					})
				} else {
					Eitri.navigation.navigate({
						path: links.orderDetailsRoute || '/OrderDetails',
						state: { orderId: intent.orderId }
					})
				}
				return true
			case 'orderList':
				if (links.orderTarget === 'native') {
					Eitri.nativeNavigation.open({
						slug: links.accountSlug || 'account',
						initParams: { route: links.orderListRoute || '/OrderList' }
					})
				} else {
					Eitri.navigation.navigate({ path: links.orderListRoute || '/OrderList' })
				}
				return true
			case 'browser':
			case 'external':
			default:
				if (intent.url) openInBrowser(intent.url, cfg)
				return true
		}
	} catch (error) {
		console.log('[LinkRouter] erro ao navegar, caindo para o browser', error)
		if (intent.url) openInBrowser(intent.url, cfg)
		return false
	}
}

/**
 * Atalho: classifica a URL e navega.
 * @param {string} url
 * @param {{ config?: object, extraRules?: Array, onNavigate?: (intent) => boolean }} [options]
 *   onNavigate: interceptador do host — retorne true para consumir o intent
 *   (a navegação padrão não roda).
 */
export function openLink(url, options = {}) {
	const config = options.config || getChatConfig()
	const intent = classifyLink(url, { config, extraRules: options.extraRules })
	return runIntent(intent, config, options)
}

function runIntent(intent, config, options = {}) {
	if (typeof options.onNavigate === 'function' && options.onNavigate(intent) === true) return intent
	navigateToIntent(intent, config)
	return intent
}

/**
 * Quebra o `product_retailer_id` do carrossel em SKU + seller.
 *
 * A integração de catálogo da VTEX publica o id no formato `skuId#sellerId`
 * (ex.: `1313607#1`); alguns fluxos mandam só o skuId. O `#` precisa sair antes
 * de qualquer uso — nem a PDP nem o `Vtex.cart.addItem` entendem o id composto.
 *
 * @param {object} item product_item da Weni
 * @returns {{ skuId: string|null, sellerId: string|null }}
 */
export function parseProductRetailerId(item) {
	const raw = item?.product_retailer_id
	if (raw === undefined || raw === null || raw === '') {
		return { skuId: null, sellerId: item?.seller_id || null }
	}

	const [skuId, sellerFromId] = String(raw).split('#')
	return { skuId: skuId || null, sellerId: item?.seller_id || sellerFromId || null }
}

/**
 * Abre a PDP de um product_item do carrossel.
 *
 * @param {object} item product_item da Weni
 * @param {{ config?: object, extraRules?: Array, onNavigate?: (intent) => boolean,
 *          resolveProduct?: (skuId: string) => Promise<object> }} [options]
 * @returns {Promise<object|null>} intent navegado, ou null se não houver identificador
 */
export async function openProductItem(item, options = {}) {
	const config = options.config || getChatConfig()
	const url = item?.product_url
	const { skuId, sellerId } = parseProductRetailerId(item)
	diagLog('[product] tap', { url: url || null, sku: skuId || null })

	const urlIntent = url ? classifyLink(url, { config, extraRules: options.extraRules }) : null
	if (urlIntent?.intent === 'product') return runIntent(urlIntent, config, options)

	if (skuId) {
		const product = getCachedProduct(skuId) || (await resolveProductBySku(skuId, options.resolveProduct))
		return runIntent({ intent: 'product', skuId, sellerId, product, url }, config, options)
	}

	if (urlIntent) return runIntent(urlIntent, config, options)

	diagLog('[product] item sem product_url e sem product_retailer_id')
	return null
}
