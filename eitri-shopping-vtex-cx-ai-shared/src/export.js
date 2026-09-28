// eitri-shopping-vtex-cx-ai-shared
//
// Atendimento (chat Weni + IA) para apps Eitri/VTEX. O pacote tem duas camadas:
//
//   1. INTEGRAÇÃO com a API da Weni (socket, sessão, histórico, storage,
//      protocolo). É o que sai por este export.js hoje.
//
//   2. EXPERIÊNCIA completa e agnóstica de marca (componentes, ChatService,
//      config, hook). Os arquivos estão em `src/components`, `src/config`,
//      `src/hooks` e `src/services`, e a dev view (`src/views/Home.jsx`) roda
//      a experiência inteira com `eitri start`. NÃO sai por este export.js:
//      ver o bloco comentado no fim do arquivo.

// --- Integração com a Weni -------------------------------------------------------
export { default as WeniWebchatService } from './services/weni/index'

export {
	SERVICE_EVENTS,
	CONNECTION_STATUS,
	MESSAGE_TYPES,
	MESSAGE_STATUS,
	MESSAGE_DIRECTIONS,
	STORAGE_TYPES,
	ERROR_TYPES,
	QUICK_REPLY_TYPES,
	DEFAULTS
} from './services/weni/utils/constants'

export {
	getWebStorage,
	isUsingMemoryStore,
	hydrate,
	persist,
	clearMirror,
	getStoredSessionId,
	clearLocalSession
} from './services/weni/env/EitriEnv'

export { diagLog, getDiag, clearDiag } from './services/weni/env/diag'

// --- Experiência completa (desativada) -------------------------------------------
//
// Reative este bloco para um cliente que vá usar a UI do pacote em vez da
// própria. Os pontos de entrada são <ChatLauncher/> (home), <ChatScreen/>
// (conta) e <WeniChat/> (composição à mão).
//
// ATENÇÃO antes de reativar: o Forge resolve tag JSX pelo nome literal contra um
// registro único. Se o app consumidor (ou um pacote dele) já tiver um componente
// com o mesmo nome — `WeniChat`, `ChatInput`, `ChatMessage`… — o build quebra com
// "A tag <X> não está presente na biblioteca de componentes", e importar com
// alias NÃO resolve. Foi por isso que a Valisere consome só a integração acima:
// a UI dela é local e usa exatamente esses nomes.
//
// export { default as ChatLauncher } from './components/launcher/ChatLauncher'
// export { default as ChatScreen } from './components/screen/ChatScreen'
// export { default as WeniChat } from './components/chat/WeniChat'
// export { default as ChatFab } from './components/launcher/ChatFab'
// export { default as ChatSheet } from './components/launcher/ChatSheet'
// export { default as ChatHeader } from './components/chat/ChatHeader'
// export { default as ChatAvatar } from './components/chat/ChatAvatar'
// export { default as ChatStatusBanner } from './components/chat/ChatStatusBanner'
// export { default as ChatMessage } from './components/chat/ChatMessage'
// export { default as MessageText, tokenizeMessageText } from './components/chat/MessageText'
// export { default as LinkCard } from './components/chat/LinkCard'
// export { default as QuickReplies } from './components/chat/QuickReplies'
// export { default as ListMessage } from './components/chat/ListMessage'
// export { default as TypingIndicator } from './components/chat/TypingIndicator'
// export { default as ChatInput } from './components/chat/ChatInput'
// export { default as ProductCarousel } from './components/chat/ProductCarousel'
// export { default as ChatProductItem, formatPrice } from './components/chat/ChatProductItem'
// export { default as ChatEmptyState } from './components/chat/EmptyState'
// export { ChatUIContext, useChatUI } from './components/chat/ChatUIContext'
// export { getAccentColor, accentBgStyle, accentTextStyle, accentBorderStyle } from './components/chat/accentColor'
// export { default as useWeniChat } from './hooks/useWeniChat'
//
// export {
// 	initChat,
// 	resetChat,
// 	ensureConnected,
// 	suspendChat,
// 	syncCustomFields,
// 	syncOrderFormField,
// 	startNewConversation,
// 	sendChatMessage,
// 	sendCameraPhoto,
// 	sendGalleryImage,
// 	sendDocument,
// 	startDictation,
// 	stopDictation,
// 	isVoiceAvailable,
// 	loadHistoryPage,
// 	getChatService
// } from './services/ChatService'
//
// export {
// 	classifyLink,
// 	openLink,
// 	openProductItem,
// 	parseProductRetailerId,
// 	navigateToIntent,
// 	openInBrowser
// } from './services/LinkRouter'
//
// export { loadChatConfig, getChatConfig, setChatConfig, deepMerge, DEFAULT_CHAT_CONFIG } from './config/ChatConfig'
