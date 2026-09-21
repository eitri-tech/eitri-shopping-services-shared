import EventEmitter from './utils/EventEmitter';

import WebSocketManager from './core/WebSocketManager';
import SessionManager from './core/SessionManager';
import MessageProcessor from './core/MessageProcessor';
import StateManager from './core/StateManager';
import StorageManager from './core/StorageManager';

import HistoryManager from './modules/HistoryManager';
import FileHandler from './modules/FileHandler';
import CameraRecorder from './modules/CameraRecorder';
import AudioRecorder from './modules/AudioRecorder';

import RetryStrategy from './network/RetryStrategy';

import { validateConfig, validateStartersData } from './utils/validators';
import {
  DEFAULTS,
  SERVICE_EVENTS,
  ALLOWED_FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  MESSAGE_DIRECTIONS,
  CONNECTION_STATUS,
  STORAGE_TYPES,
  ERROR_TYPES,
  QUICK_REPLY_TYPES,
} from './utils/constants';
import {
  buildTextMessage,
  buildMediaMessage,
  buildOrderMessage,
  buildMessagePayload,
  buildCustomFieldMessage,
  buildStartersRequest,
  buildConversationStatusMessage,
} from './utils/messageBuilder';

/**
 * WeniWebchatService
 *
 * Main service class that provides a complete WebChat solution.
 * Framework-agnostic JavaScript library with event-based API.
 *
 * Features:
 * - WebSocket connection management
 * - Session persistence
 * - Message queue and processing
 * - File and audio handling
 * - History management
 * - State management via EventEmitter
 *
 * @example
 * const service = new WeniWebchatService({
 *   socketUrl: 'wss://websocket.weni.ai',
 *   channelUuid: 'your-uuid'
 * })
 *
 * service.on('message:received', (message) => {
 *   console.log('New message:', message)
 * })
 *
 * await service.init()
 * service.sendMessage('Hello!')
 */
export default class WeniWebchatService extends EventEmitter {
  constructor(config = {}) {
    super();

    validateConfig(config);

    this.config = {
      socketUrl: config.socketUrl,
      channelUuid: config.channelUuid,
      host: config.host || '',
      clientId: config.clientId || null,
      sessionToken: config.sessionToken || null,
      connectOn: config.connectOn || DEFAULTS.CONNECT_ON,
      storage: config.storage || DEFAULTS.STORAGE,
      callbackUrl: config.callbackUrl || '',
      autoReconnect: config.autoReconnect !== false,
      maxReconnectAttempts:
        config.maxReconnectAttempts || DEFAULTS.MAX_RECONNECT_ATTEMPTS,
      reconnectInterval:
        config.reconnectInterval || DEFAULTS.RECONNECT_INTERVAL,
      pingInterval: config.pingInterval || DEFAULTS.PING_INTERVAL,
      messageDelay: config.messageDelay || DEFAULTS.MESSAGE_DELAY,
      typingDelay: config.typingDelay || DEFAULTS.TYPING_DELAY,
      autoClearCache:
        config.autoClearCache !== false || DEFAULTS.AUTO_CLEAR_CACHE,
      cacheTimeout: config.cacheTimeout || DEFAULTS.CACHE_TIMEOUT,
      displayUnreadCount:
        config.displayUnreadCount || DEFAULTS.DISPLAY_UNREAD_COUNT,
      renderPercentage: config.renderPercentage || DEFAULTS.RENDER_PERCENTAGE,
      mode: config.mode || DEFAULTS.MODE,
      ...config,
    };

    // Initialize retry strategy for WebSocket reconnection
    this.retryStrategy = new RetryStrategy({
      baseDelay: this.config.reconnectInterval || DEFAULTS.RECONNECT_INTERVAL,
      maxDelay: 30000, // 30 seconds max
      factor: 2,
      jitter: true,
      maxJitter: 1000,
    });

    // Initialize core modules
    this.storage = new StorageManager(this.config.storage);
    this.state = new StateManager();
    this.session = new SessionManager(this.storage, this.config);
    this.websocket = new WebSocketManager({
      ...this.config,
      retryStrategy: this.retryStrategy,
    });
    this.messageProcessor = new MessageProcessor(this.config);

    // Initialize feature modules
    this.history = new HistoryManager(this.websocket);
    this.fileHandler = new FileHandler(this.config);
    this.audioRecorder = new AudioRecorder(this.config);
    this.cameraRecorder = new CameraRecorder(this.config);

    this._setupEventListeners();

    this._initialized = false;
    this._connected = false;
    this._latestStartersFingerprint = null;

    this.messagesQueue = [];
    this._renderEnabled = true;
  }

  /**
   * Initializes the service
   * Restores session and optionally auto-connects
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (this._initialized) {
      return;
    }

    const shouldRender = this._ensureRenderDecision();

    if (!shouldRender) {
      this._renderEnabled = false;
      return { shouldRender: false };
    }

    try {
      await this.restoreOrCreateSession();

      const messages = this.state.getMessages();

      const pendingMessages = messages.filter(({ status }) =>
        ['pending'].includes(status),
      );
      this.enqueueMessages(pendingMessages);

      const canConnectInMode = this.config.mode === 'live';

      const shouldConnect =
        canConnectInMode &&
        (this.config.connectOn === 'mount' ||
          (this.config.connectOn === 'demand' &&
            this.messagesQueue.length >= 1));

      if (shouldConnect) {
        await this.connect();
      }

      this._initialized = true;
      this.emit(SERVICE_EVENTS.INITIALIZED);
    } catch (error) {
      this.state.setError(error);
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    } finally {
      return { shouldRender: true };
    }
  }

  /**
   * Connects to WebSocket server
   *
   * @returns {Promise<void>}
   */
  async connect() {
    if (this._connected || this._connecting) {
      return;
    }

    if (this.config.mode === 'preview') {
      return;
    }

    this._connecting = true;

    try {
      let sessionId = this.session.getSessionId();
      if (!sessionId) {
        sessionId = this.session.getOrCreate();
        const currentSession = this.session.getSession();
        if (currentSession) {
          this.state.setSession(currentSession);
        }
      }

      const registrationData = {
        from: sessionId,
        callback: this.config.callbackUrl,
        session_type: this.config.storage,
      };

      this.websocket.setRegistrationData(registrationData);

      await this.websocket.connect();
    } catch (error) {
      this.state.setError(error);
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  /**
   * Disconnects from WebSocket server
   */
  disconnect(permanent = true) {
    this.websocket.disconnect(permanent);
    this._connected = false;
  }

  /**
   * Sends a text message
   *
   * @param {string} text Message text
   * @param {Object} options Additional options
   * @returns {Promise<void>}
   */
  async sendMessage(text, options = {}) {
    if (!text || typeof text !== 'string') {
      throw new Error('Message text is required');
    }

    const message = buildTextMessage(text, {
      ...options,
      direction: 'outgoing',
    });

    if (!this.session.hasUserSentAnyMessage()) {
      const pendingFields = this.session.getPendingCustomFields();
      if (pendingFields && Object.keys(pendingFields).length > 0) {
        message.__customFields = { ...pendingFields };
        message.__includesPendingCustomFields = true;
      }
    }

    if (!options.hidden) {
      // Add to state
      this.state.addMessage(message);
      this.session.appendToConversation(message);
    }

    this.enqueueMessages([message]);

    if (this.isConnected()) {
      this.runQueue();
    }
  }

  enqueueMessages(messages) {
    this.messagesQueue.push(...messages);
  }

  async runQueue() {
    if ((!this.isConnected() && this.isConnecting()) || this.isReconnecting()) {
      return;
    }

    if (this.isConnected()) {
      this.messagesQueue.forEach(async (message) => {
        const payload = buildMessagePayload(
          this.session.getSessionId(),
          message,
          {
            context: this.state.getContext(),
          },
        );

        try {
          await this.websocket.send(payload);
          this.emit(SERVICE_EVENTS.MESSAGE_SENT, message);
        } catch (error) {
          this.state.updateMessage(message.id, { status: 'error' });
          this.emit(SERVICE_EVENTS.ERROR, error);
          throw error;
        }
      });

      this.messagesQueue = [];
    } else if (this.config.connectOn === 'demand') {
      if (this.config.mode === 'preview') {
        return;
      }
      await this.connect();
      this.runQueue();
    }
  }

  /**
   * Simulates a message received
   *
   * @param {Object} message Message object
   * @returns {void}
   */
  simulateMessageReceived(message) {
    this.messageProcessor.process({
      ...message,
      persisted: true,
    });
  }

  /**
   * Simulates a message sent locally (not sent to the socket)
   *
   * @param {Object|string} input Message object or plain text
   * @param {Object} [options] Additional options when input is string
   * @returns {void}
   */
  simulateMessageSent(input, options = {}) {
    let message;

    if (typeof input === 'string') {
      message = buildTextMessage(input, {
        ...options,
        direction: 'outgoing',
        status: 'sent',
      });
    } else if (input && typeof input === 'object') {
      if (input.type === 'text') {
        message = buildTextMessage(input.text || '', {
          ...input,
          direction: 'outgoing',
          status: 'sent',
        });
      } else if (['image', 'video', 'audio', 'file'].includes(input.type)) {
        message = buildMediaMessage(input.type, input.media, {
          ...input,
          direction: 'outgoing',
          status: 'sent',
        });
      } else {
        message = buildTextMessage(String(input.text || ''), {
          ...input,
          direction: 'outgoing',
          status: 'sent',
        });
      }
    } else {
      return;
    }

    this.state.addMessage(message);
    this.session.appendToConversation(message);
    this.session.setLastMessageSentAt(Date.now());
  }

  /**
   * Adds a local-only conversation status row (stored in session; not sent over WebSocket).
   * Survives reconnect/history merge like other persisted local rows.
   * Host apps should render messages with type conversation_status using text and statusType
   * (semantic strings such as success, info, or any custom value).
   *
   * @param {string} text Status text
   * @param {string} statusType Semantic type for styling (e.g. success, info)
   * @param {Object} [options] Optional id, timestamp, direction, metadata
   * @returns {Object} The message object that was appended
   */
  addConversationStatus(text, statusType, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Status text is required');
    }
    if (!statusType || typeof statusType !== 'string' || !statusType.trim()) {
      throw new Error('Status type is required');
    }

    const message = buildConversationStatusMessage(
      text.trim(),
      statusType.trim(),
      options,
    );

    this.state.addMessage(message);
    this.session.appendToConversation(message);

    return message;
  }

  /**
   * Sends an order message with cart product items
   *
   * @param {Array} productItems Array of product items
   * @returns {Promise<void>}
   */
  async sendOrder(productItems) {
    if (
      !productItems ||
      !Array.isArray(productItems) ||
      productItems.length === 0
    ) {
      throw new Error('Product items are required');
    }

    const message = buildOrderMessage(productItems, {
      direction: 'outgoing',
    });

    // Add to state so the order appears in the chat
    this.state.addMessage(message);
    this.session.appendToConversation(message);

    this.enqueueMessages([message]);

    if (this._initialized) {
      this.runQueue();
    }
  }

  /**
   * Sends a file attachment
   *
   * @param {File} file File object
   * @returns {Promise<void>}
   */
  async sendAttachment(file) {
    if (!file) {
      throw new Error('File is required');
    }

    try {
      const fileData = await this.fileHandler.process(file);

      const message = buildMediaMessage(fileData.type, fileData.base64, {
        direction: 'outgoing',
        metadata: {
          filename: fileData.filename,
          size: fileData.size,
          mimeType: fileData.mimeType,
        },
      });

      if (!this.session.hasUserSentAnyMessage()) {
        const pendingFields = this.session.getPendingCustomFields();
        if (pendingFields && Object.keys(pendingFields).length > 0) {
          message.__customFields = { ...pendingFields };
          message.__includesPendingCustomFields = true;
        }
      }

      this.state.addMessage(message);
      this.session.appendToConversation(message);

      this.enqueueMessages([message]);
      this.runQueue();
    } catch (error) {
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Sends an audio recording
   *
   * @param {Object} audioData Audio data from recorder
   * @returns {Promise<void>}
   */
  async sendAudio(audioData) {
    if (!audioData || !audioData.base64) {
      throw new Error('Audio data is required');
    }

    try {
      const message = buildMediaMessage('audio', audioData.base64, {
        direction: 'outgoing',
        metadata: {
          duration: audioData.duration,
          mimeType: audioData.mimeType,
        },
      });

      if (!this.session.hasUserSentAnyMessage()) {
        const pendingFields = this.session.getPendingCustomFields();
        if (pendingFields && Object.keys(pendingFields).length > 0) {
          message.__customFields = { ...pendingFields };
          message.__includesPendingCustomFields = true;
        }
      }

      this.state.addMessage(message);
      this.session.appendToConversation(message);

      this.enqueueMessages([message]);
      this.runQueue();
    } catch (error) {
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Sends a media message from already-encoded data (base64 / data URL).
   *
   * Eitri addition: native pickers (Eitri.camera / Eitri.fs) return an EitriFile
   * whose toBase64() yields the encoded content directly, so we skip the browser
   * FileHandler used by sendAttachment(File). Otherwise identical: attaches
   * pending custom fields to the first message, persists, enqueues and flushes.
   *
   * @param {'image'|'video'|'audio'|'file'} mediaType
   * @param {string} media base64 string or data URL
   * @param {Object} [metadata] e.g. { filename, size, mimeType }
   * @returns {Promise<void>}
   */
  async sendMedia(mediaType, media, metadata = {}) {
    if (!media) {
      throw new Error('Media is required');
    }

    try {
      const message = buildMediaMessage(mediaType, media, {
        direction: 'outgoing',
        metadata,
      });

      if (!this.session.hasUserSentAnyMessage()) {
        const pendingFields = this.session.getPendingCustomFields();
        if (pendingFields && Object.keys(pendingFields).length > 0) {
          message.__customFields = { ...pendingFields };
          message.__includesPendingCustomFields = true;
        }
      }

      this.state.addMessage(message);
      this.session.appendToConversation(message);

      this.enqueueMessages([message]);
      this.runQueue();
    } catch (error) {
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Gets message history from server
   *
   * @param {Object} options History options
   * @returns {Promise<Array>}
   */
  async getHistory(options = {}) {
    try {
      const messages = await this.history.request(options);

      const currentMessages = this.state.getMessages();
      const merged = this.history.merge(messages, currentMessages);

      this.state.setState({ messages: merged });
      this.session.setConversation(merged);

      return messages;
    } catch (error) {
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Requests PDP conversation starters for a product page.
   * Sends a get_pdp_starters message via WebSocket. Results arrive
   * asynchronously through 'starters:received' or 'starters:error' events.
   *
   * @param {Object} productData Product data with required account and linkText fields
   * @throws {Error} If productData is invalid or WebSocket is not connected
   */
  getStarters(productData) {
    validateStartersData(productData);

    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    this._latestStartersFingerprint =
      productData.account + ':' + productData.linkText;

    const payload = buildStartersRequest(
      this.session.getSessionId(),
      productData,
    );

    this.websocket.send(payload);
  }

  /**
   * Clears the active starters request fingerprint.
   * Prevents any in-flight starters response from being emitted.
   * Should be called when navigating away from a product page.
   */
  clearStarters() {
    this._latestStartersFingerprint = null;
  }

  /**
   * Sets context for messages
   *
   * @param {string} context Context string
   */
  setContext(context) {
    this.state.setContext(context);
    this.emit(SERVICE_EVENTS.CONTEXT_CHANGED, context);
  }

  /**
   * Gets current context
   *
   * @returns {string}
   */
  getContext() {
    return this.state.getContext();
  }

  /**
   * Sets a custom field
   *
   * @param {string} field
   * @param {string} value
   */
  setCustomField(field, value) {
    if (this.session.hasUserSentAnyMessage()) {
      const message = buildCustomFieldMessage(field, value);
      this.enqueueMessages([message]);
      if (this._initialized) {
        this.runQueue();
      }
    } else {
      this.session.addPendingCustomField(field, value);
    }
  }

  /**
   * Gets current state
   *
   * @returns {Object}
   */
  getState() {
    return this.state.getState();
  }

  /**
   * Gets current session
   *
   * @returns {Object}
   */
  getSession() {
    return this.session.getSession();
  }

  /**
   * Gets all messages
   *
   * @returns {Array}
   */
  getMessages() {
    return this.state.getMessages();
  }

  /**
   * Gets session ID
   *
   * @returns {string|null}
   */
  getSessionId() {
    return this.session.getSessionId();
  }

  /**
   * Sets session ID
   * If there's an active session, restarts it with the new ID
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async setSessionId(sessionId) {
    // Store the new session ID
    this.session.setSessionId(sessionId);

    // If initialized with active session, restart it
    if (this._initialized && this.session.getSession()) {
      const wasConnected = this.isConnected();

      // Disconnect if connected
      if (wasConnected || this._connecting) {
        this.disconnect(false);
      }

      // Clear current session and state
      this.clearSession();

      // Create new session with the provided ID
      this.createNewSession();

      // Reconnect if was previously connected
      if (wasConnected) {
        await this.connect();
      }
    }
  }

  /**
   * Sets whether the chat widget is open
   * @param {boolean} isOpen
   */
  setIsChatOpen(isOpen) {
    this.session.setIsChatOpen(isOpen);
  }

  /**
   * Gets whether the chat widget is open
   * @returns {boolean}
   */
  getIsChatOpen() {
    return this.session.getIsChatOpen();
  }

  /**
   * Clears session and messages
   */
  clearSession() {
    this.session.clear();
    this.state.reset();
    this.emit(SERVICE_EVENTS.SESSION_CLEARED);
  }

  /**
   * Clears messages while keeping the session and connection
   */
  clearMessages() {
    this.state.clearMessages();
    this.session.setConversation([]);
    this.emit(SERVICE_EVENTS.MESSAGES_CLEARED);
  }

  async restoreOrCreateSession() {
    const session = await this.session.restore();

    if (session) {
      this.state.setSession(session);
      this.emit(SERVICE_EVENTS.SESSION_RESTORED, session);
    } else {
      this.createNewSession();
    }
  }

  createNewSession() {
    this.session.createNewSession();
    this.state.setSession(this.session.getSession());
  }

  /**
   * Starts camera recording
   *
   * @returns {Promise<void>}
   */
  async startCameraRecording() {
    return this.cameraRecorder.start();
  }

  /**
   * Stops camera recording
   *
   * @returns {Promise<void>}
   */
  async stopCameraRecording() {
    return this.cameraRecorder.stop();
  }

  /**
   * Checks if camera permission is already granted
   * @returns {Promise<boolean|undefined>}
   */
  async hasCameraPermission() {
    return await this.cameraRecorder.hasPermission();
  }

  /**
   * Requests camera permission and returns the permission state
   * @returns {Promise<boolean|undefined>}
   * @throws {Error} If permission is denied or not supported
   */
  async requestCameraPermission() {
    return await this.cameraRecorder.requestPermission();
  }

  /**
   * Switches to the next camera device
   * @returns {Promise<void>}
   */
  async switchToNextCameraDevice() {
    return await this.cameraRecorder.switchToNextDevice();
  }

  /**
   * Starts audio recording
   *
   * @returns {Promise<void>}
   */
  async startRecording() {
    return this.audioRecorder.start();
  }

  /**
   * Stops audio recording and sends it
   *
   * @returns {Promise<void>}
   */
  async stopRecording() {
    const audioData = await this.audioRecorder.stop();
    await this.sendAudio(audioData);
  }

  /**
   * Cancels audio recording
   */
  cancelRecording() {
    this.audioRecorder.cancel();
  }

  /**
   * Checks if microphone permission is already granted
   * @returns {Promise<boolean|undefined>}
   */
  async hasAudioPermission() {
    return await this.audioRecorder.hasPermission();
  }

  /**
   * Requests microphone permission and returns the permission state
   * @returns {Promise<boolean|undefined>}
   * @throws {Error} If permission is denied or not supported
   */
  async requestAudioPermission() {
    return await this.audioRecorder.requestPermission();
  }

  /**
   * Gets connection status
   *
   * @returns {string}
   */
  getConnectionStatus() {
    return this.websocket.getStatus();
  }

  /**
   * Checks if service is connected
   *
   * @returns {boolean}
   */
  isConnected() {
    return this._connected && this.websocket.getStatus() === 'connected';
  }

  isConnecting() {
    return this._connecting;
  }

  isReconnecting() {
    return this.websocket.getStatus() === 'reconnecting';
  }

  isRenderEnabled() {
    return Boolean(this._renderEnabled);
  }

  /**
   * Ensures the render decision is persisted and returns it.
   * Key: weni:aichat:session:[channelUuid]:render
   * Value format: [renderPercentage]:[boolean]
   * If the stored percentage differs from current, recalculates and overwrites.
   * @private
   * @returns {boolean}
   */
  _ensureRenderDecision() {
    const storageKey = `weni:aichat:session:${this.config.channelUuid}:render`;

    const percentage =
      typeof this.config.renderPercentage === 'number'
        ? Math.max(0, Math.min(100, this.config.renderPercentage))
        : 100;

    const localStorage = typeof window !== 'undefined' && window.localStorage;

    const write = (val) => localStorage?.setItem(storageKey, val);
    const read = () => localStorage?.getItem(storageKey);
    const clear = () => localStorage?.removeItem(storageKey);

    if ([100, 0].includes(percentage)) {
      clear();
      return percentage === 100;
    }

    const stored = read();
    let decision = null;

    if (typeof stored === 'string' && stored.includes(':')) {
      const [storedPercStr, storedBoolStr] = stored.split(':');
      if (Number(storedPercStr) === percentage) {
        decision = storedBoolStr === 'true';
      }
    }

    if (decision === null) {
      decision = Math.random() * 100 < percentage;
      write(`${percentage}:${decision}`);
    }

    return decision;
  }

  /**
   * Gets retry strategy information
   *
   * @returns {Object} Retry strategy stats
   */
  getRetryInfo() {
    return {
      attempts: this.retryStrategy.getAttempts(),
      nextDelay: this.retryStrategy.getDelay(),
      maxAttempts: this.config.maxReconnectAttempts,
    };
  }

  /**
   * Gets allowed file types configuration
   * Useful for setting the accept attribute on file inputs
   *
   * @returns {Array<string>} Array of allowed MIME types
   */
  getAllowedFileTypes() {
    return this.fileHandler.config.allowedTypes;
  }

  /**
   * Gets file configuration including size limits
   *
   * @returns {Object} File configuration
   */
  getFileConfig() {
    return {
      allowedTypes: this.getAllowedFileTypes(),
      maxFileSize: this.fileHandler.config.maxFileSize,
      acceptAttribute: this.getAllowedFileTypes().join(','),
    };
  }

  /**
   * Resets retry strategy counter
   * Useful for manual reconnection attempts
   */
  resetRetryStrategy() {
    this.retryStrategy.reset();
  }

  /**
   * Requests single-use ElevenLabs voice tokens from the Weni backend.
   * The server responds with a `voice_tokens` message containing the tokens.
   *
   * @param {number} [timeoutMs=10000] Maximum wait time in milliseconds
   * @returns {Promise<{ sttToken: string, ttsToken: string }>}
   */
  requestVoiceTokens(timeoutMs = 10000) {
    return this.websocket.requestVoiceTokens(timeoutMs);
  }

  /**
   * Adds a product to cart through WebSocket and waits for confirmation.
   *
   * @param {Object} props
   * @param {string} props.VTEXAccountName
   * @param {string} props.orderFormId
   * @param {string} props.seller
   * @param {string} props.id
   * @param {number} [timeoutMs=30000] Maximum wait time in milliseconds
   * @returns {Promise<{ id: string }>}
   */
  addProductToCart(props, timeoutMs = 30000) {
    return this.websocket.addProductToCart(props, timeoutMs);
  }

  /**
   * Destroys service instance
   */
  destroy() {
    this.disconnect();
    this.removeAllListeners();
    this._initialized = false;
    this._connected = false;
  }

  async _handleWebSocketConnected() {
    const previousLocalMessagesIds = this.session
      .getConversation()
      .filter(({ direction, status, persisted }) => {
        if (persisted) {
          return false;
        }

        return (
          direction === 'incoming' ||
          (direction === 'outgoing' && status === 'sent')
        );
      })
      .filter(({ id }) => id.startsWith('msg_'))
      .map((message) => message.id);

    this.getHistory({
      page: 1,
      limit: 20,
    }).then(() => {
      if (previousLocalMessagesIds.length > 0) {
        const idsToRemove = new Set(previousLocalMessagesIds);
        const filtered = this.state
          .getMessages()
          .filter((m) => !idsToRemove.has(m?.id));
        this.state.setState({ messages: filtered });
        this.session.setConversation(filtered);
      }
    });

    this.runQueue();
  }

  /**
   * Sets up internal event listeners
   * @private
   */
  _setupEventListeners() {
    // WebSocket events
    this.websocket.on(SERVICE_EVENTS.RECONNECTING, (attempts) => {
      this.state.setConnectionStatus('reconnecting', {
        reconnectAttempts: attempts,
      });
      this.emit(SERVICE_EVENTS.RECONNECTING, attempts);
    });

    this.websocket.on(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, (status) => {
      if (status === 'connected') {
        this._connected = true;
        this.emit(SERVICE_EVENTS.CONNECTED);
        this._handleWebSocketConnected();
      }

      if (status === 'disconnected') {
        this._connected = false;
        this.emit(SERVICE_EVENTS.DISCONNECTED);
      }

      if (status === 'closed') {
        this._connected = false;
        this.emit(SERVICE_EVENTS.CLOSED);
      }

      this.state.setConnectionStatus(status);
      this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, status);
    });

    this.websocket.on(SERVICE_EVENTS.MESSAGE, (msg) => {
      this.messageProcessor.process(msg);
    });

    this.websocket.on(SERVICE_EVENTS.ERROR, (error) => {
      this.state.setError(error);
      this.emit(SERVICE_EVENTS.ERROR, error);
    });

    this.websocket.on(SERVICE_EVENTS.LANGUAGE_CHANGED, (language) => {
      this.emit(SERVICE_EVENTS.LANGUAGE_CHANGED, language);
    });

    this.websocket.on(SERVICE_EVENTS.STARTERS_RECEIVED, (data) => {
      if (this._latestStartersFingerprint !== null) {
        this._latestStartersFingerprint = null;
        this.emit(SERVICE_EVENTS.STARTERS_RECEIVED, data);
      }
    });

    this.websocket.on(SERVICE_EVENTS.STARTERS_ERROR, (data) => {
      if (this._latestStartersFingerprint !== null) {
        this._latestStartersFingerprint = null;
        this.emit(SERVICE_EVENTS.STARTERS_ERROR, data);
      }
    });

    this.websocket.on(SERVICE_EVENTS.VOICE_ENABLED, () => {
      this.emit(SERVICE_EVENTS.VOICE_ENABLED);
    });

    this.websocket.on(SERVICE_EVENTS.VOICE_TOKENS_RECEIVED, (data) => {
      this.emit(SERVICE_EVENTS.VOICE_TOKENS_RECEIVED, data);
    });

    this.websocket.on(SERVICE_EVENTS.VOICE_TOKENS_ERROR, (data) => {
      this.emit(SERVICE_EVENTS.VOICE_TOKENS_ERROR, data);
    });

    this.websocket.on(SERVICE_EVENTS.CART_UPDATED, (data) => {
      this.emit(SERVICE_EVENTS.CART_UPDATED, data);
    });

    // Message processor events
    this.messageProcessor.on(SERVICE_EVENTS.MESSAGE_PROCESSED, (msg) => {
      this.state.addMessage(msg);
      this.session.appendToConversation(msg);
      this.emit(SERVICE_EVENTS.MESSAGE_RECEIVED, msg);
    });

    this.messageProcessor.on(
      SERVICE_EVENTS.MESSAGE_UPDATED,
      (messageId, updates) => {
        this.state.updateMessage(messageId, updates);
        this.session.updateConversation(messageId, updates);
        this.emit(SERVICE_EVENTS.MESSAGE_UPDATED, messageId, updates);
      },
    );

    this.messageProcessor.on(SERVICE_EVENTS.TYPING_START, () => {
      this.state.setTyping(true);
      this.emit(SERVICE_EVENTS.TYPING_START);
    });

    this.messageProcessor.on(SERVICE_EVENTS.TYPING_STOP, () => {
      this.state.setTyping(false);
      this.emit(SERVICE_EVENTS.TYPING_STOP);
    });

    this.messageProcessor.on(SERVICE_EVENTS.THINKING_START, () => {
      this.state.setThinking(true);
      this.emit(SERVICE_EVENTS.THINKING_START);
    });

    this.messageProcessor.on(SERVICE_EVENTS.THINKING_STOP, () => {
      this.state.setThinking(false);
      this.emit(SERVICE_EVENTS.THINKING_STOP);
    });

    this.messageProcessor.on(SERVICE_EVENTS.ERROR, (error) => {
      this.emit(SERVICE_EVENTS.ERROR, error);
    });

    this.messageProcessor.on(SERVICE_EVENTS.MESSAGE_UNKNOWN, (rawMessage) => {
      this.emit(SERVICE_EVENTS.MESSAGE_UNKNOWN, rawMessage);
    });

    this.session.on(
      SERVICE_EVENTS.CONTACT_TIMEOUT_MAXIMUM_TIME_REACHED,
      async () => {
        if (this.websocket.getStatus() === 'disconnected') {
          await this.connect();
        }

        this.websocket
          .isContactAllowedToBeClosed()
          .then(() => {
            this.clearSession();
            this.createNewSession();

            const registrationData = {
              from: this.session.getSessionId(),
              callback: this.config.callbackUrl,
              session_type: this.config.storage,
            };

            this.websocket.setRegistrationData(registrationData);
            this.disconnect(false);
          })
          .catch((error) => this.emit(SERVICE_EVENTS.ERROR, error));
      },
    );

    this.session.on(SERVICE_EVENTS.CHAT_OPEN_CHANGED, (isOpen) => {
      this.emit(SERVICE_EVENTS.CHAT_OPEN_CHANGED, isOpen);
    });

    // State manager events
    this.state.on(SERVICE_EVENTS.STATE_CHANGED, (newState, oldState) => {
      this.emit(SERVICE_EVENTS.STATE_CHANGED, newState, oldState);
    });

    // Camera recorder events
    this.cameraRecorder.on(SERVICE_EVENTS.CAMERA_STREAM_RECEIVED, (stream) => {
      this.emit(SERVICE_EVENTS.CAMERA_STREAM_RECEIVED, stream);
    });

    this.cameraRecorder.on(SERVICE_EVENTS.CAMERA_RECORDING_STARTED, () => {
      this.emit(SERVICE_EVENTS.CAMERA_RECORDING_STARTED);
    });

    this.cameraRecorder.on(SERVICE_EVENTS.CAMERA_RECORDING_STOPPED, () => {
      this.emit(SERVICE_EVENTS.CAMERA_RECORDING_STOPPED);
    });

    this.cameraRecorder.on(SERVICE_EVENTS.CAMERA_DEVICES_CHANGED, (devices) => {
      this.emit(SERVICE_EVENTS.CAMERA_DEVICES_CHANGED, devices);
    });

    // Audio recorder events
    this.audioRecorder.on(SERVICE_EVENTS.RECORDING_STARTED, () => {
      this.emit(SERVICE_EVENTS.RECORDING_STARTED);
    });

    this.audioRecorder.on(SERVICE_EVENTS.RECORDING_STOPPED, (result) => {
      this.emit(SERVICE_EVENTS.RECORDING_STOPPED, result);
    });

    this.audioRecorder.on(SERVICE_EVENTS.RECORDING_TICK, (duration) => {
      this.emit(SERVICE_EVENTS.RECORDING_TICK, duration);
    });

    this.audioRecorder.on(SERVICE_EVENTS.ERROR, (error) => {
      this.emit(SERVICE_EVENTS.ERROR, error);
    });

    // File handler events
    this.fileHandler.on(SERVICE_EVENTS.FILE_PROCESSED, (file) => {
      this.emit(SERVICE_EVENTS.FILE_PROCESSED, file);
    });

    this.fileHandler.on(SERVICE_EVENTS.ERROR, (error) => {
      this.emit(SERVICE_EVENTS.ERROR, error);
    });

    // History manager events
    this.history.on(SERVICE_EVENTS.HISTORY_LOADED, (messages) => {
      this.emit(SERVICE_EVENTS.HISTORY_LOADED, messages);
    });

    this.history.on(SERVICE_EVENTS.ERROR, (error) => {
      this.emit(SERVICE_EVENTS.ERROR, error);
    });

    this.on(SERVICE_EVENTS.MESSAGE_SENT, (message) => {
      const typingTypes = ['text', 'image', 'video', 'audio', 'file'];

      if (message.id) {
        this.state.updateMessage(message.id, { status: 'sent' });
        this.session.updateConversation(message.id, { status: 'sent' });
      }

      this.session.setLastMessageSentAt(Date.now());

      if (message.__includesPendingCustomFields) {
        this.session.clearPendingCustomFields();
      }

      if (typingTypes.includes(message.type)) {
        this.messageProcessor.startTypingOnMessageSent();
      }
    });
  }
}

// Static methods
WeniWebchatService.isAudioRecordingSupported = AudioRecorder.isSupported;

// Static constants
WeniWebchatService.ALLOWED_FILE_TYPES = ALLOWED_FILE_TYPES;
WeniWebchatService.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
WeniWebchatService.ALLOWED_VIDEO_TYPES = ALLOWED_VIDEO_TYPES;
WeniWebchatService.ALLOWED_AUDIO_TYPES = ALLOWED_AUDIO_TYPES;
WeniWebchatService.ALLOWED_DOCUMENT_TYPES = ALLOWED_DOCUMENT_TYPES;
WeniWebchatService.MESSAGE_TYPES = MESSAGE_TYPES;
WeniWebchatService.MESSAGE_STATUS = MESSAGE_STATUS;
WeniWebchatService.MESSAGE_DIRECTIONS = MESSAGE_DIRECTIONS;
WeniWebchatService.CONNECTION_STATUS = CONNECTION_STATUS;
WeniWebchatService.STORAGE_TYPES = STORAGE_TYPES;
WeniWebchatService.ERROR_TYPES = ERROR_TYPES;
WeniWebchatService.QUICK_REPLY_TYPES = QUICK_REPLY_TYPES;
WeniWebchatService.SERVICE_EVENTS = SERVICE_EVENTS;
WeniWebchatService.DEFAULTS = DEFAULTS;

export {
  ALLOWED_FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  MESSAGE_DIRECTIONS,
  CONNECTION_STATUS,
  STORAGE_TYPES,
  ERROR_TYPES,
  QUICK_REPLY_TYPES,
  SERVICE_EVENTS,
  DEFAULTS,
};
