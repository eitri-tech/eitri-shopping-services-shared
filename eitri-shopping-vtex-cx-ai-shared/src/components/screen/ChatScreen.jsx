import Eitri from 'eitri-bifrost'
import { useEffect } from 'react'

import WeniChat from '../chat/WeniChat'

/**
 * ChatScreen
 *
 * A experiência de atendimento ocupando uma tela inteira — a contraparte do
 * ChatLauncher (que é botão flutuante + painel sobre a tela do host). Uso
 * típico: a rota /Chat do app de conta, aberta pelo botão "Falar com o
 * atendimento".
 *
 *   // src/views/Chat.jsx
 *   export default function Chat() {
 *       return <ChatScreen config={CHAT_CONFIG} onAddToCart={...} />
 *   }
 *
 * Props: { config?, onBack?, onMount?, surface?, ...weniChatProps }
 *  - config: overrides da marca (mesmo shape do remoteConfig)
 *  - onBack: default é Eitri.navigation.back()
 *  - onMount: gancho do host para tracking de tela
 *  - surface (default 'account'): repassado ao <WeniChat/>
 *  - onAddToCart / resolveProduct / components / texts / slots: repassados
 *    ao <WeniChat/>
 *
 * O header é o da lib (avatar, status, nova conversa). Para usar o header do
 * próprio app, passe `components={{ Header: MeuHeader }}` — o componente
 * recebe `connectionStatus`, `onNewConversation`, `onBack` e pode ler o resto
 * por `useChatUI()`.
 *
 * O <Page> NÃO usa `topInset`: quem consome o safe-area da status bar é o
 * ChatHeader (com o mesmo fundo do header, para parecer uma peça só). Ligar
 * nos dois reserva o espaço duas vezes.
 *
 * O `h-screen` no <Page> é obrigatório, não estético: o <Page> não tem altura
 * própria, e o <WeniChat/> é `flex flex-col h-full`. Sem altura no pai, o
 * `h-full` resolve para a altura do conteúdo e o composer sobe para logo
 * abaixo do empty state, com o resto da tela em branco. O painel da home não
 * sofre disso porque o ChatSheet crava altura em `style`.
 */
export default function ChatScreen(props) {
	const { onBack, onMount, surface = 'account', ...chatProps } = props

	useEffect(() => {
		onMount && onMount()
	}, [])

	const handleBack = () => {
		if (typeof onBack === 'function') return onBack()
		try {
			Eitri.navigation.back()
		} catch (_) {
			/* noop */
		}
	}

	return (
		<Page className='h-screen'>
			<WeniChat
				{...chatProps}
				onBack={handleBack}
				surface={surface}
			/>
		</Page>
	)
}
