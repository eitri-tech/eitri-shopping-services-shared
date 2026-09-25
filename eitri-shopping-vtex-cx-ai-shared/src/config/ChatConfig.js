import Eitri from 'eitri-bifrost'

import DEFAULT_CHAT_CONFIG from './defaultChatConfig'

/**
 * ChatConfig
 *
 * Resolve a configuração efetiva do chat em três camadas:
 *   1. defaults embarcados (defaultChatConfig — shape do weni_p do widget web)
 *   2. remoteConfig da marca: Eitri.environment.getRemoteConfigs()[seção],
 *      onde a seção é própria do chat (padrão 'weniChat'), separada do appConfigs
 *   3. overrides passados em runtime (props do componente / opções do hook)
 *
 * O resultado é cacheado em módulo; o ChatService lê via getChatConfig().
 */

let _config = null

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Merge profundo: objetos são mesclados recursivamente; arrays e primitivos
 * são substituídos. `undefined` no override preserva o valor base.
 */
export function deepMerge(base, override) {
	if (!isPlainObject(base) || !isPlainObject(override)) {
		return override === undefined ? base : override
	}
	const result = { ...base }
	for (const key of Object.keys(override)) {
		const value = override[key]
		if (value === undefined) continue
		result[key] = isPlainObject(base[key]) && isPlainObject(value) ? deepMerge(base[key], value) : value
	}
	return result
}

/**
 * Normalizações defensivas sobre a config final.
 * - socketUrl precisa estar na forma http(s):// — o WebSocketManager monta
 *   `wss://${host}/ws` removendo apenas http(s)://; um wss:// publicado por
 *   engano no remoteConfig geraria `wss://wss://...` inválido.
 */
function normalizeConfig(config) {
	if (typeof config.socketUrl === 'string' && /^wss?:\/\//i.test(config.socketUrl)) {
		config.socketUrl = config.socketUrl.replace(/^wss?:\/\//i, 'https://')
	}
	return config
}

/**
 * Lê a seção do chat no remote config do Eitri. Aceita tanto um objeto quanto
 * uma string JSON (alguns painéis publicam valores serializados).
 * @param {string} section
 * @returns {Promise<object>}
 */
async function fetchRemoteSection(section) {
	try {
		const remoteConfig = await Eitri.environment.getRemoteConfigs()
		let value = remoteConfig?.[section]
		if (typeof value === 'string') {
			try {
				value = JSON.parse(value)
			} catch (_) {
				value = null
			}
		}
		return isPlainObject(value) ? value : {}
	} catch (error) {
		console.log('[ChatConfig] remote config indisponível, usando defaults', error)
		return {}
	}
}

/**
 * Resolve e cacheia a configuração efetiva do chat.
 * @param {object} [overrides] valores com precedência máxima (props do app host)
 * @returns {Promise<object>} config efetiva
 */
export async function loadChatConfig(overrides = {}) {
	const section = overrides?.remoteConfigSection || DEFAULT_CHAT_CONFIG.remoteConfigSection
	const remote = await fetchRemoteSection(section)
	_config = normalizeConfig(deepMerge(deepMerge(DEFAULT_CHAT_CONFIG, remote), overrides || {}))
	return _config
}

/**
 * Config efetiva atual (defaults enquanto loadChatConfig não resolveu).
 * @returns {object}
 */
export function getChatConfig() {
	return _config || DEFAULT_CHAT_CONFIG
}

/**
 * Define a config diretamente (testes / hosts que montam a config sozinhos).
 */
export function setChatConfig(config) {
	_config = normalizeConfig(deepMerge(DEFAULT_CHAT_CONFIG, config || {}))
	return _config
}

export { DEFAULT_CHAT_CONFIG }
