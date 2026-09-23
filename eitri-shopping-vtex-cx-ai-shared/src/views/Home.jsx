import { useState } from 'react'

import { ChatLauncher, WeniChat } from '../export'

/**
 * Home
 *
 * View de desenvolvimento deste Eitri-App compartilhado — mesma convenção dos
 * outros shared do repo. Serve para rodar o chat isolado com `eitri start`,
 * sem precisar subir um app de loja inteiro.
 *
 * Os apps que consomem o pacote NÃO passam por aqui: eles importam
 * <ChatLauncher/>, <ChatScreen/> ou <WeniChat/> do `export.js`.
 *
 * Só uma superfície por vez nesta view, nunca as duas juntas: `ChatService.js`
 * é um singleton por módulo (um `_service` só, correto pra produção — Home e
 * Account são apps/WebViews separados, cada um com sua própria instância do
 * módulo). Montar `<ChatLauncher/>` e um `<WeniChat surface='account'/>` juntos
 * aqui ficaria nesse MESMO runtime JS, então o segundo a inicializar
 * derrubaria a conexão do primeiro (o guard de troca de identidade em
 * `initChat()` faria exatamente isso) — não prova nada sobre o fix, só
 * reproduz um problema diferente e exclusivo desta view.
 *
 * Pra testar as duas superfícies ao mesmo tempo de verdade: abra esta mesma
 * URL em DUAS abas do navegador (cada aba = um runtime JS separado, como dois
 * apps de verdade) e deixe uma no modo Home e outra no modo Account.
 *
 * `onAddToCart` e `resolveProduct` ficam de fora de propósito: dependem do
 * carrinho e do catálogo do app host, que não existem aqui.
 */

/**
 * Valores de UMA loja (Cia Marítima) só para o teste local — cópia do
 * `src/config/chatConfig.js` do app da home. Nada aqui é lido pelos apps que
 * consomem o pacote: eles passam o próprio `config`.
 *
 * `avatarUrl` fica de fora porque o PNG mora no app da loja; sem ele o
 * ChatAvatar desenha o balão sobre a `mainColor`. Para ver o avatar real,
 * aponte para uma URL.
 */
const DEV_CHAT_CONFIG = {
	channelUuid: '8218578b-bc8d-491e-aca1-f6a3d469d6f2',
	defaultVtexAccount: 'ciamaritima',
	mainColor: '#AC936D',
	customizeWidget: {
		// neutro de propósito: o dourado da marca competia com o título do header
		headerActionColor: '#171717',
		launcherColor: '#AC936D',
		userMessageBubbleColor: '#AC936D',
		quickRepliesFontColor: '#AC936D',
		quickRepliesBackgroundColor: '#AC936D33',
		quickRepliesBorderColor: '#AC936D'
	},
	debug: false
}

const MODES = [
	{ id: 'home', label: 'Modo Home (ChatLauncher)' },
	{ id: 'account', label: 'Modo Account (WeniChat)' }
]

export default function Home() {
	const [mode, setMode] = useState('home')

	return (
		<Page>
			{/* Conteúdo só para o FAB ter uma tela por baixo, como na home da loja. */}
			<View
				padding='large'
				direction='column'
				gap={8}>
				<Text className='text-lg font-bold text-neutral-900'>eitri-shopping-vtex-cx-ai-shared</Text>
				<Text className='text-sm text-neutral-500'>
					Só uma superfície por vez nesta aba (motivo no topo do arquivo). Pra testar as duas
					independentes, abra esta URL em outra aba e escolha o outro modo lá.
				</Text>
				<View
					direction='row'
					gap={2}>
					{MODES.map(m => (
						<View
							key={m.id}
							onClick={() => setMode(m.id)}
							className={`px-3 py-2 rounded-lg border text-sm ${
								mode === m.id
									? 'bg-neutral-900 border-neutral-900 text-white'
									: 'bg-white border-neutral-200 text-neutral-700'
							}`}>
							{m.label}
						</View>
					))}
				</View>
			</View>

			{mode === 'account' ? (
				<View
					className='w-full border-t border-neutral-200'
					style={{ height: 520 }}>
					<WeniChat
						config={DEV_CHAT_CONFIG}
						surface='account'
						topInset={false}
						showBack={false}
					/>
				</View>
			) : (
				<ChatLauncher config={DEV_CHAT_CONFIG} />
			)}
		</Page>
	)
}
