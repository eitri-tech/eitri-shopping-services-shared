import { ChatLauncher } from '../export'

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

export default function Home() {
	return (
		<Page>
			{/* Conteúdo só para o FAB ter uma tela por baixo, como na home da loja. */}
			<View
				padding='large'
				direction='column'
				gap={8}>
				<Text className='text-lg font-bold text-neutral-900'>eitri-shopping-vtex-cx-ai-shared</Text>
				<Text className='text-sm text-neutral-500'>
					Toque no botão flutuante para abrir o atendimento. Troque o ChatLauncher pelo ChatScreen para testar
					a superfície de tela cheia (a /Chat da conta).
				</Text>
			</View>

			<ChatLauncher config={DEV_CHAT_CONFIG} />
		</Page>
	)
}
