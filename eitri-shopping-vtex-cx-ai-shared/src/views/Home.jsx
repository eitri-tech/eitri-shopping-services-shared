import { ChatScreen } from '../export'

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
export default function Home() {
	return (
		<ChatScreen
			config={{
				channelUuid: '',
				defaultVtexAccount: '',
				debug: true
			}}
		/>
	)
}
