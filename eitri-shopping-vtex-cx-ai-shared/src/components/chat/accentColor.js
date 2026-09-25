/**
 * Cor de destaque (marca) da experiência de chat, resolvida a partir da
 * config (config.customizeWidget.launcherColor -> config.mainColor),
 * publicável por loja via remoteConfig['weniChat'] — sem mudança de código
 * ao reutilizar este pacote em outra marca/projeto.
 */
export function getAccentColor(config) {
	return config?.customizeWidget?.launcherColor || config?.mainColor || '#262626'
}

export function accentBgStyle(config) {
	return { backgroundColor: getAccentColor(config) }
}

export function accentTextStyle(config) {
	return { color: getAccentColor(config) }
}

export function accentBorderStyle(config) {
	return { borderColor: getAccentColor(config) }
}
