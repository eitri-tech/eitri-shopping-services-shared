import { createContext, useContext } from 'react'

/**
 * ChatUIContext
 *
 * Contexto interno da experiência de chat. O WeniChat publica aqui a config
 * efetiva, os textos, o mapa de componentes (defaults + overrides do host) e
 * os handlers compartilhados (openLink, openProduct, addToCart), para que QUALQUER
 * componente da árvore — inclusive um override do host — acesse o mesmo
 * ambiente sem prop drilling.
 */
export const ChatUIContext = createContext({
	config: {},
	texts: {},
	components: {},
	chat: null,
	openLink: () => {},
	openProduct: async () => {},
	addToCart: async () => {}
})

/**
 * Hook de acesso ao ambiente do chat (config, texts, components, openLink,
 * openProduct, addToCart, chat). Disponível para componentes custom do host.
 */
export function useChatUI() {
	return useContext(ChatUIContext)
}
