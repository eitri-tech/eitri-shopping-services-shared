// eitri-shopping-vtex-cx-ai-shared
//
// Integração com a API da Weni (webchat) para apps Eitri/VTEX. Só transporte:
// socket, sessão, histórico, storage e protocolo de mensagens. Nada de UI,
// comportamento de tela ou estilo — isso vive no app de cada loja.

// --- Serviço Weni --------------------------------------------------------------
export { default as WeniWebchatService } from './services/weni/index'

// --- Constantes do protocolo ----------------------------------------------------
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

// --- Storage do Eitri (espelho da sessão em sharedStorage) ----------------------
export {
	getWebStorage,
	isUsingMemoryStore,
	hydrate,
	persist,
	clearMirror,
	getStoredSessionId,
	clearLocalSession
} from './services/weni/env/EitriEnv'

// --- Diagnóstico ----------------------------------------------------------------
export { diagLog, getDiag, clearDiag } from './services/weni/env/diag'
