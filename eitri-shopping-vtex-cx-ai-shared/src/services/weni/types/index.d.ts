/**
 * Service configuration options
 */
export interface ServiceConfig {
  // Required
  socketUrl: string
  channelUuid: string
 
  // Connection
  host?: string
  mode?: 'preview' | 'live'
  connectOn?: 'mount' | 'manual' | 'demand'
  storage?: 'local' | 'session'
  callbackUrl?: string
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
  pingInterval?: number
 
  // Session
  sessionId?: string
  sessionToken?: string
  clientId?: string
 
  // Messages
  initPayload?: string
  messageDelay?: number | ((message: Message) => number)
  typingDelay?: number
  customMessageDelay?: (text: string) => number
 
  // Cache
  autoClearCache?: boolean
  cacheTimeout?: number
  contactTimeout?: number
  
  // Advanced
  customData?: Record<string, any>
  params?: Record<string, any>

  // NEW: Professional logging system
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  logEnabled?: boolean
  
  // NEW: Page tracking manager
  enablePageTracking?: boolean
}

/**
 * Message types
 */
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'location'
  | 'interactive'
  | 'conversation_status'

/**
 * Message structure
 */
export interface Message {
  // Core fields
  id?: string
  ID?: string // Uppercase for history compatibility
  type: MessageType
  text?: string
  /** Semantic category for conversation_status rows (e.g. success, info); host-defined */
  statusType?: string

  // Media fields
  media?: string // Base64 or URL for sending or receiving
  caption?: string // Media caption
  
  // Metadata
  timestamp?: number
  direction?: 'incoming' | 'outgoing' | 'in' | 'out'
  sender?: 'response' | 'client'
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error' // NEW: Message status tracking
  
  // Interactive elements
  quick_replies?: QuickReply[]

  
  // Additional data
  metadata?: Record<string, any>
  persisted?: boolean
}

/**
 * Quick reply button
 */
export interface QuickReply {
  type: 'text' | 'location' | 'email' | 'phone'
  title: string
  payload?: string
}

/**
 * Chat state
 */
export interface ChatState {
  messages: Message[]
  session: SessionData
  connection: ConnectionState
  context: string
  isTyping: boolean
  error?: Error | null
}

/**
 * Session data
 */
export interface SessionData {
  id: string
  createdAt: number
  lastActivity: number
  metadata?: Record<string, any>
}

/**
 * Connection state
 */
export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
  reconnectAttempts?: number
  lastError?: string
}

/**
 * WebSocket message payload
 */
export interface WebSocketMessage {
  type: string
  message?: any
  context?: string
  from?: string
  session_type?: string
  callback?: string
  token?: string
  trigger?: string
}

/**
 * Product data for PDP conversation starters request
 */
export interface StartersData {
  account: string
  linkText: string
  productName?: string
  description?: string
  brand?: string
  attributes?: Record<string, string>
}

/**
 * History request options
 */
export interface HistoryOptions {
  limit?: number
  page?: number
  before?: number
  after?: number
}

/**
 * File upload data
 */
export interface FileUploadData {
  type: MessageType
  base64: string
  filename?: string
  size?: number
  mimeType?: string
}

/**
 * Audio recording options
 */
export interface AudioRecordingOptions {
  maxDuration?: number
  mimeType?: string
  audioBitsPerSecond?: number
}

/**
 * NEW: Error types (structured error handling)
 */
export type ErrorType = 'network' | 'validation' | 'permission' | 'storage' | 'server' | 'websocket' | 'unknown'

/**
 * WebSocket error types
 */
export type WebSocketErrorType = 'forbidden' | 'warning' | 'error' | 'connection_closed' | 'duplicate_session'

/**
 * NEW: Error entry (structured error tracking)
 */
export interface ErrorEntry {
  id: string
  error: Error
  type: ErrorType
  context: Record<string, any>
  timestamp: number
  stack?: string | null
}

/**
 * NEW: WebSocket error action (structured error handling)
 */
export interface WebSocketErrorAction {
  type: string | null
  canReconnect: boolean
  delay: number
  showModal: boolean
  message: string
}

/**
 * NEW: Logger configuration (professional logging)
 */
export interface LoggerConfig {
  level?: 'debug' | 'info' | 'warn' | 'error'
  prefix?: string
  enabled?: boolean
  timestamp?: boolean
  colors?: boolean
  transports?: string[]
}

/**
 * NEW: Retry strategy configuration (exponential backoff)
 */
export interface RetryStrategyConfig {
  baseDelay?: number
  maxDelay?: number
  factor?: number
  jitter?: boolean
  maxJitter?: number
}

/**
 * NEW: Metadata configuration (centralized metadata manager)
 */
export interface MetadataConfig {
  linkTarget?: string
  userInput?: string
  pageChangeCallbacks?: PageChangeCallback[]
  domHighlight?: DOMHighlightConfig | null
  pageEventCallbacks?: any[]
}

/**
 * Page change callback
 */
export interface PageChangeCallback {
  url: string
  callbackIntent?: string
  intent?: string
  regex?: boolean
  errorIntent?: string | null
  enabled?: boolean
}

/**
 * NEW: DOM highlight configuration (DOM interaction manager)
 */
export interface DOMHighlightConfig {
  selector: string
  style?: Record<string, string>
  class?: string
  scroll?: boolean
}

/**
 * NEW: Analytics event (analytics manager)
 */
export interface AnalyticsEvent {
  id: string
  name: string
  data: Record<string, any>
  timestamp: number
  sessionTime: number
}

/**
 * NEW: Analytics metrics (analytics manager)
 */
export interface AnalyticsMetrics {
  messagesSent: number
  messagesReceived: number
  attachmentsSent: number
  recordingsSent: number
  connectionAttempts: number
  connectionFailures: number
  sessionStartTime: number
  totalUptime: number
  averageSessionDuration?: number
  successRate?: number
}

/**
 * Params configuration
 */
export interface ParamsConfig {
  storage?: 'local' | 'session'
  [key: string]: any
}

/**
 * Retry information
 */
export interface RetryInfo {
  attempts: number
  nextDelay: number
  maxAttempts: number
}

/**
 * File configuration
 */
export interface FileConfig {
  allowedTypes: string[]
  maxFileSize: number
  acceptAttribute: string
}

export interface AddProductToCartProps {
  VTEXAccountName: string
  orderFormId: string
  seller: string
  id: string
}

/**
 * Main service class
 */
export default class WeniWebchatService {
  constructor(config: ServiceConfig)

  // Lifecycle
  init(): Promise<void>
  connect(): Promise<void>
  disconnect(): void
  destroy(): void

  // Messages
  sendMessage(text: string, options?: any): Promise<void>
  addConversationStatus(
    text: string,
    statusType: string,
    options?: any
  ): Message
  addProductToCart(
    props: AddProductToCartProps,
    timeoutMs?: number
  ): Promise<{ id: string }>
  sendAttachment(file: File): Promise<void>
  sendAudio(audioData: any): Promise<void>

  // History
  getHistory(options?: any): Promise<Message[]>

  // Starters
  getStarters(productData: StartersData): void
  clearStarters(): void

  // Context
  setContext(context: string): void
  getContext(): string

  // State
  getState(): ChatState
  getMessages(): Message[]
  getSessionId(): string | null
  getConnectionStatus(): string
  isConnected(): boolean
  isModeVisible(): boolean

  // Session
  clearSession(): void

  // Audio recording
  startRecording(): Promise<void>
  stopRecording(): Promise<void>
  cancelRecording(): void

  // Retry strategy
  getRetryInfo(): RetryInfo
  resetRetryStrategy(): void

  // File configuration
  getAllowedFileTypes(): string[]
  getFileConfig(): FileConfig

  // Events
  on(event: string, callback: (...args: any[]) => void): this
  off(event: string, callback: (...args: any[]) => void): this
  emit(event: string, ...args: any[]): boolean

  // Static methods
  static isAudioRecordingSupported(): boolean
  
  // Static constants
  static ALLOWED_FILE_TYPES: string[]
  static MESSAGE_TYPES: Record<string, MessageType>
  static MESSAGE_STATUS: Record<string, string>
  static MESSAGE_DIRECTIONS: Record<string, string>
  static CONNECTION_STATUS: Record<string, string>
  static STORAGE_TYPES: Record<string, string>
  static ERROR_TYPES: Record<string, string>
  static QUICK_REPLY_TYPES: Record<string, string>
  static SERVICE_EVENTS: Record<string, string>
  static DEFAULTS: any
}

// Named exports for constants
export const ALLOWED_FILE_TYPES: string[]
export const MESSAGE_TYPES: Record<string, MessageType>
export const MESSAGE_STATUS: Record<string, string>
export const MESSAGE_DIRECTIONS: Record<string, string>
export const CONNECTION_STATUS: Record<string, string>
export const STORAGE_TYPES: Record<string, string>
export const ERROR_TYPES: Record<string, string>
export const QUICK_REPLY_TYPES: Record<string, string>
export const SERVICE_EVENTS: Record<string, string>
export const DEFAULTS: any
