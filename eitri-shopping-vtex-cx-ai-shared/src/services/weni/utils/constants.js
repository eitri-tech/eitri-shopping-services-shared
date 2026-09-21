/**
 * Global Constants
 */

export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  LOCATION: 'location',
  INTERACTIVE: 'interactive',
  CONVERSATION_STATUS: 'conversation_status',
  TYPING: 'typing',
};

export const MESSAGE_DIRECTIONS = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
};

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  STREAMING: 'streaming',
  ERROR: 'error',
};

export const WS_MESSAGE_TYPES = {
  REGISTER: 'register',
  MESSAGE: 'message',
  PING: 'ping',
  PONG: 'pong',
  TYPING: 'typing',
  HISTORY: 'get_history',
  GET_PDP_STARTERS: 'get_pdp_starters',
  STARTERS: 'starters',
  ACK: 'ack',
  ERROR: 'error',
  WARNING: 'warning',
  FORBIDDEN: 'forbidden',
  REQUEST_VOICE_TOKENS: 'request_voice_tokens',
  VOICE_TOKENS: 'voice_tokens',
};

export const STORAGE_KEYS = {
  SESSION: 'weni:aichat:session',
  STATE: 'weni:aichat:state',
  MESSAGES: 'weni:aichat:messages',
  CONFIG: 'weni:aichat:config',
};

export const STORAGE_TYPES = {
  LOCAL: 'local',
  SESSION: 'session',
};

export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  STORAGE: 'storage',
  SERVER: 'server',
  WEBSOCKET: 'websocket',
  UNKNOWN: 'unknown',
};

export const WS_ERROR_TYPES = {
  FORBIDDEN: 'forbidden',
  WARNING: 'warning',
  ERROR: 'error',
  CONNECTION_CLOSED: 'connection_closed',
  DUPLICATE_SESSION: 'duplicate_session',
};

export const DEFAULTS = {
  // Rendering
  RENDER_PERCENTAGE: 100,

  // Connection
  MODE: 'live', // 'live' | 'preview'
  CONNECT_ON: 'mount',
  STORAGE: 'local',
  AUTO_RECONNECT: true,
  MAX_RECONNECT_ATTEMPTS: 30,
  MAX_RECLAIM_ATTEMPTS: 3,
  RECONNECT_INTERVAL: 3000,
  PING_INTERVAL: 50000,
  MAX_PING_LIMIT: 216,

  // Messages
  MESSAGE_DELAY: 1000,
  TYPING_DELAY: 2000,
  ENABLE_TYPING_INDICATOR: true,
  TYPING_TIMEOUT: 50000, // 50 seconds
  DISPLAY_UNREAD_COUNT: false,

  // Cache
  AUTO_CLEAR_CACHE: true,
  CACHE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CONTACT_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours

  // Files
  MAX_FILE_SIZE: 32 * 1024 * 1024, // 32MB
  COMPRESS_IMAGES: true,
  IMAGE_QUALITY: 0.8,
  MAX_IMAGE_WIDTH: 1920,
  MAX_IMAGE_HEIGHT: 1080,

  // Audio
  MAX_RECORDING_DURATION: 120000, // 2 minutes
  AUDIO_BITS_PER_SECOND: 128000,

  // History
  HISTORY_LIMIT: 20,
  HISTORY_PAGE: 1,

  // Logging
  LOG_LEVEL: 'info',
  LOG_ENABLED: true,
};

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

export const AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/mpeg',
];

export const QUICK_REPLY_TYPES = {
  TEXT: 'text',
  LOCATION: 'location',
  EMAIL: 'email',
  PHONE: 'phone',
};

export const SERVICE_EVENTS = {
  // Lifecycle
  INITIALIZED: 'initialized',
  DESTROYED: 'destroyed',

  // Connection
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  CLOSED: 'closed',
  CONNECTION_STATUS_CHANGED: 'connection:status:changed',

  // Contact timeout
  CONTACT_TIMEOUT_MAXIMUM_TIME_REACHED: 'contact:timeout:maximum_time_reached',
  CONTACT_TIMEOUT_ALLOWED_TO_CLOSE: 'contact:timeout:allowed_to_close',
  CONTACT_TIMEOUT_ERROR: 'contact:timeout:error',

  // Messages
  MESSAGE: 'message',
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_ADDED: 'message:added',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_REMOVED: 'message:removed',
  MESSAGE_PROCESSED: 'message:processed',
  MESSAGE_UNKNOWN: 'message:unknown',
  MESSAGES_CLEARED: 'messages:cleared',

  // Language
  LANGUAGE_CHANGED: 'language:changed',

  // Typing & Thinking
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  THINKING_START: 'thinking:start',
  THINKING_STOP: 'thinking:stop',

  // Session
  SESSION_RESTORED: 'session:restored',
  SESSION_CLEARED: 'session:cleared',
  SESSION_CHANGED: 'session:changed',

  // State
  STATE_CHANGED: 'state:changed',
  STATE_RESET: 'state:reset',

  // Context
  CONTEXT_CHANGED: 'context:changed',

  // Recording
  RECORDING_STARTED: 'recording:started',
  RECORDING_STOPPED: 'recording:stopped',
  RECORDING_CANCELLED: 'recording:cancelled',
  RECORDING_TICK: 'recording:tick',

  // Camera
  CAMERA_STREAM_RECEIVED: 'camera:stream:received',
  CAMERA_RECORDING_STARTED: 'camera:recording:started',
  CAMERA_RECORDING_STOPPED: 'camera:recording:stopped',
  CAMERA_DEVICES_CHANGED: 'camera:devices:changed',

  // Files
  FILE_PROCESSED: 'file:processed',

  // History
  HISTORY_LOADED: 'history:loaded',
  HISTORY_LOADING_START: 'loading:start',
  HISTORY_LOADING_END: 'loading:end',
  HISTORY_RESPONSE: 'history:response',
  HISTORY_REQUESTED: 'history:requested',
  HISTORY_MERGED: 'history:merged',
  HISTORY_CACHE_CLEARED: 'history:cache:cleared',

  // Voice
  VOICE_ENABLED: 'voice:enabled',
  VOICE_TOKENS_RECEIVED: 'voice:tokens:received',
  VOICE_TOKENS_ERROR: 'voice:tokens:error',

  // Cart
  CART_UPDATED: 'cart:updated',

  // WebSocket
  WS_REGISTERED: 'registered',
  WS_FORBIDDEN: 'websocket:forbidden',
  WS_WARNING: 'websocket:warning',
  WS_DUPLICATE_SESSION: 'websocket:duplicate_session',

  // Errors
  ERROR: 'error',

  // Metadata
  METADATA_CHANGED: 'metadata:changed',

  // Page events
  PAGE_CHANGED: 'page:changed',

  // Chat
  CHAT_OPEN_CHANGED: 'chat:open:changed',

  // Starters
  STARTERS_RECEIVED: 'starters:received',
  STARTERS_ERROR: 'starters:error',
};

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

export const VERSION = '1.0.0';

export const SERVICE_NAME = '@weni/webchat-service';

export const MESSAGE_ID_PREFIX = 'msg_';

export const STREAM_INITIAL_SEQUENCE = 1;

/** Max idle time after the first delta (and between deltas) before auto-finalizing the stream */
export const STREAM_START_TIMEOUT_MS = 2000;
