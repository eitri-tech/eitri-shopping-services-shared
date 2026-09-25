import { useEffect, useState } from 'react'

import ChatFab from './ChatFab'
import ChatSheet from './ChatSheet'
import { loadChatConfig, getChatConfig } from '../../config/ChatConfig'

/**
 * ChatLauncher
 *
 * Botão flutuante + painel do assistente, com o estado de aberto/fechado já
 * resolvido. É o ponto de entrada do chat numa tela do host (tipicamente a
 * home): uma linha e a experiência inteira sobe.
 *
 *   <ChatLauncher
 *     config={CHAT_CONFIG}
 *     onAddToCart={handleAddToCart}
 *     resolveProduct={getProductBySku}
 *   />
 *
 * Props: { config?, onOpen?, onClose?, surface?, ...weniChatProps }
 *  - config: overrides da marca (mesmo shape do remoteConfig). Precedência:
 *    defaults < remoteConfig[seção] < este objeto
 *  - onOpen/onClose: ganchos para o host (ex.: tracking de tela)
 *  - surface (default 'home'): repassado ao <WeniChat/> dentro do painel
 *  - onAddToCart / resolveProduct / components / texts: repassados ao
 *    <WeniChat/> dentro do painel
 *
 * O FAB precisa da cor e do avatar ANTES de o chat abrir, e essas vêm do
 * remoteConfig — que é assíncrono. Por isso a config é resolvida aqui no mount
 * e não dentro do <WeniChat/>, que só monta quando o painel abre.
 */
export default function ChatLauncher(props) {
	const { config: configOverrides, onOpen, onClose, surface = 'home', ...chatProps } = props
	const [isOpen, setIsOpen] = useState(false)
	const [effectiveConfig, setEffectiveConfig] = useState(getChatConfig)

	useEffect(() => {
		let active = true
		loadChatConfig(configOverrides)
			.then(resolved => {
				if (active) setEffectiveConfig(resolved)
			})
			.catch(error => console.log('[ChatLauncher] falha ao resolver config do chat', error))
		return () => {
			active = false
		}
	}, [configOverrides])

	const handleOpen = () => {
		setIsOpen(true)
		onOpen && onOpen()
	}

	const handleClose = () => {
		setIsOpen(false)
		onClose && onClose()
	}

	return (
		<>
			<ChatFab
				onTap={handleOpen}
				config={effectiveConfig}
			/>
			<ChatSheet
				{...chatProps}
				config={configOverrides}
				open={isOpen}
				onClose={handleClose}
				sheetTop={effectiveConfig?.launcher?.sheetTop}
				surface={surface}
			/>
		</>
	)
}
