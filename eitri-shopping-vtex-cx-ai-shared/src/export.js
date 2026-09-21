// eitri-shopping-vtex-cx-ai-shared
//
// Experiência de atendimento (chat Weni + IA) para apps Eitri/VTEX, comum a
// todas as marcas. Nada aqui é específico de loja: cor, avatar, channelUuid e
// conta VTEX vêm da config (remoteConfig['weniChat'] ou prop `config`).
//
// Três pontos de entrada, conforme a superfície:
//   <ChatLauncher />  botão flutuante + painel sobre a tela (uso típico: home)
//   <ChatScreen />    tela inteira com voltar (uso típico: /Chat da conta)
//   <WeniChat />      só a experiência, para compor à mão
//
// Tudo abaixo é exportado para dar liberdade total de composição/override.

// --- Pontos de entrada ---------------------------------------------------------
export { default as ChatLauncher } from './components/launcher/ChatLauncher'
export { default as ChatScreen } from './components/screen/ChatScreen'
export { default as WeniChat } from './components/chat/WeniChat'

// --- Peças do launcher (para quem quer controlar o estado de abertura) ----------
export { default as ChatFab } from './components/launcher/ChatFab'
export { default as ChatSheet } from './components/launcher/ChatSheet'

// --- Componentes individuais (reuso ou base para overrides) ---------------------
export { default as ChatHeader } from './components/chat/ChatHeader'
export { default as ChatAvatar } from './components/chat/ChatAvatar'
export { default as ChatStatusBanner } from './components/chat/ChatStatusBanner'
export { default as ChatMessage } from './components/chat/ChatMessage'
export { default as MessageText, tokenizeMessageText } from './components/chat/MessageText'
export { default as LinkCard } from './components/chat/LinkCard'
export { default as QuickReplies } from './components/chat/QuickReplies'
export { default as ListMessage } from './components/chat/ListMessage'
export { default as TypingIndicator } from './components/chat/TypingIndicator'
export { default as ChatInput } from './components/chat/ChatInput'
export { default as ProductCarousel } from './components/chat/ProductCarousel'
export { default as ChatProductItem, formatPrice } from './components/chat/ChatProductItem'
export { default as ChatEmptyState } from './components/chat/EmptyState'
export { ChatUIContext, useChatUI } from './components/chat/ChatUIContext'
export { getAccentColor, accentBgStyle, accentTextStyle, accentBorderStyle } from './components/chat/accentColor'

// --- Hook (para quem quer montar a própria UI) ----------------------------------
export { default as useWeniChat } from './hooks/useWeniChat'

// --- Serviços -------------------------------------------------------------------
export {
	initChat,
	resetChat,
	ensureConnected,
	suspendChat,
	syncCustomFields,
	syncOrderFormField,
	startNewConversation,
	sendChatMessage,
	sendCameraPhoto,
	sendGalleryImage,
	sendDocument,
	startDictation,
	stopDictation,
	isVoiceAvailable,
	loadHistoryPage,
	getChatService,
	getDiag,
	SERVICE_EVENTS
} from './services/ChatService'

export {
	classifyLink,
	openLink,
	openProductItem,
	parseProductRetailerId,
	navigateToIntent,
	openInBrowser
} from './services/LinkRouter'

// --- Configuração ----------------------------------------------------------------
export { loadChatConfig, getChatConfig, setChatConfig, deepMerge, DEFAULT_CHAT_CONFIG } from './config/ChatConfig'
