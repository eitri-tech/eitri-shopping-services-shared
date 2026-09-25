/**
 * defaultChatConfig
 *
 * Configuração padrão da experiência de atendimento. Mantém o mesmo shape do
 * script de configuração do widget web da Weni (weni_p) — assim a MESMA
 * estrutura pode ser publicada no remoteConfig (seção própria, ver
 * `remoteConfigSection`) e gerenciada por marca sem mudança de código —
 * acrescido de chaves específicas do runtime Eitri (links, texts, theme).
 *
 * Precedência final (ver ChatConfig.loadChatConfig):
 *   defaults (este arquivo)  <  remoteConfig[remoteConfigSection]  <  overrides via props
 *
 * Este pacote é compartilhado por TODAS as marcas — nada aqui pode ser
 * específico de uma loja. O mínimo que cada loja precisa publicar (no
 * remoteConfig ou via prop `config`) é:
 *
 *   channelUuid         canal WWC da marca na Weni          (obrigatório)
 *   defaultVtexAccount  conta VTEX da marca                 (obrigatório)
 *   mainColor           cor de destaque da marca            (recomendado)
 *   avatarUrl           avatar do assistente                (recomendado)
 */
const DEFAULT_CHAT_CONFIG = {
	// Seção do remote config (Eitri.environment.getRemoteConfigs()) onde a marca
	// pode publicar esta mesma estrutura. Seção separada do appConfigs.
	remoteConfigSection: 'weniChat',

	// --- Identidade / textos do widget -------------------------------------
	title: 'Atendimento',
	subtitle: '',
	inputTextFieldHint: '',
	tooltipMessage: '',

	// Avatar do assistente (header do chat e botão flutuante da home). URL —
	// este pacote é compartilhado por várias marcas, então a imagem NÃO vem
	// embarcada. Sem valor, cai num ícone de balão sobre a cor de destaque.
	avatarUrl: '',

	// --- Comportamento -------------------------------------------------------
	showFullScreenButton: true,
	displayUnreadCount: true,
	initPayload: '',
	startFullScreen: true,
	showVoiceRecordingButton: true,
	showCameraButton: true,
	navigateIfSameDomain: true,
	embedded: false,
	contactTimeout: 1439,
	useConnectionOptimization: true,
	voiceMode: {
		enabled: false,
		elevenLabs: {}
	},
	addToCart: true,
	position: 'bottom-right',
	selector: '#wwc',
	conversationStarters: {
		pdp: true
	},
	connectOn: 'demand',

	// --- Cores (widget web) ----------------------------------------------------
	// `mainColor` é a cor de destaque da marca e sozinha já veste o chat inteiro
	// (bolha do usuário, chips de quick reply, botão de gravar, avatar padrão).
	// As chaves de `customizeWidget` são refinamentos opcionais: cada uma que
	// ficar vazia cai em `mainColor` (ver components/chat/accentColor.js).
	// O padrão abaixo é neutro de propósito — cada loja publica o seu.
	useConfigColors: false,
	mainColor: '#262626',
	customizeWidget: {
		headerBackgroundColor: '',
		// Ícone de "Nova conversa" no header. Vazio = cor de destaque; algumas
		// marcas preferem neutro para ele não competir com o título.
		headerActionColor: '',
		launcherColor: '',
		userMessageBubbleColor: '',
		quickRepliesFontColor: '',
		quickRepliesBackgroundColor: '',
		quickRepliesBorderColor: ''
	},

	// --- Conexão Weni -----------------------------------------------------------
	// socketUrl na forma http(s): o WebSocketManager monta `wss://${host}/ws`
	// removendo apenas o prefixo http(s):// (passar wss:// geraria URL inválida).
	socketUrl: 'https://websocket.weni.ai',
	host: 'https://flows.weni.ai',
	// OBRIGATÓRIO por loja — o canal WWC criado na Weni para aquela marca.
	// Sem ele o validateConfig derruba a conexão com erro explícito.
	channelUuid: '',
	params: {
		images: {
			dims: {
				width: 300,
				height: 200
			}
		},
		storage: 'local'
	},

	// OBRIGATÓRIO por loja — conta VTEX usada como fallback quando a sessão
	// ainda não foi configurada. Dentro de um app compartilhado o `Vtex` não
	// herda a config do host, então este é o valor que sustenta o atendimento.
	defaultVtexAccount: '',

	// Liga o painel de diagnóstico on-screen (logs do socket) dentro do chat.
	debug: false,

	// --- Botão flutuante + painel na home (ChatLauncher) ------------------------
	// Geometria do launcher arrastável e do painel que ele abre sobre a home.
	// `sheetTop` é a faixa da home que continua visível acima do painel — varia
	// com a altura do header de cada marca, por isso é configurável.
	launcher: {
		sheetTop: 140,
		fabSize: 56,
		fabTopGap: 60,
		fabBottomGap: 100,
		fabEdgeMargin: 16
	},

	// --- Navegação a partir de links do bot -------------------------------------
	// Links recebidos nas mensagens são analisados (LinkRouter) e, quando
	// reconhecidos, abrem a tela NATIVA correspondente via Eitri.nativeNavigation
	// em vez do browser. Slugs/rotas são os aliases dos eitri-apps do host.
	links: {
		pdpSlug: 'pdp',
		cartSlug: 'cart',
		checkoutSlug: 'checkout',
		accountSlug: 'account',
		// 'route' = o chat roda dentro do app de conta e navega internamente;
		// 'native' = abre o app de conta via nativeNavigation com initParams.route.
		orderTarget: 'route',
		orderDetailsRoute: '/OrderDetails',
		orderListRoute: '/OrderList',
		// Links não reconhecidos abrem no browser in-app (false = browser externo).
		openInAppBrowser: true,
		// Regras extras avaliadas ANTES das padrão. Publicáveis via remoteConfig:
		// [{ "pattern": "minha-regex-sobre-a-url", "intent": "product|cart|checkout|order|orderList|external|browser" }]
		// O primeiro grupo de captura da regex vira o parâmetro do intent
		// (slug do produto / orderId), quando aplicável.
		rules: []
	},

	// --- Textos da UI (pt-BR por padrão; sobrescrevíveis por marca) -------------
	texts: {
		header: 'Atendimento',
		headerOnline: 'Online agora',
		headerOffline: 'Offline',
		headerConnecting: 'Conectando...',
		newConversation: 'Nova conversa',
		connecting: 'Conectando...',
		reconnecting: 'Reconectando...',
		disconnected: 'Sem conexão',
		tapToReconnect: 'toque para reconectar',
		emptyTitle: 'Como podemos ajudar?',
		emptySubtitle: 'Envie uma mensagem para iniciar seu atendimento.',
		loadingMore: 'Carregando mensagens anteriores...',
		inputPlaceholder: 'Digite sua mensagem...',
		listening: 'Ouvindo... fale agora',
		camera: 'Câmera',
		gallery: 'Galeria',
		file: 'Arquivo',
		sendFailed: 'Falha ao enviar',
		openVideo: 'Abrir vídeo',
		openAudio: 'Abrir áudio',
		openFile: 'Abrir arquivo',
		addToCart: 'Adicionar',
		addedToCart: 'Produto adicionado ao carrinho',
		addToCartError: 'Não foi possível adicionar ao carrinho',
		linkProduct: 'Ver produto',
		linkCart: 'Abrir carrinho',
		linkCheckout: 'Finalizar compra',
		linkOrder: 'Ver pedido',
		linkOrderList: 'Meus pedidos',
		linkExternal: 'Abrir link'
	}
}

export default DEFAULT_CHAT_CONFIG
