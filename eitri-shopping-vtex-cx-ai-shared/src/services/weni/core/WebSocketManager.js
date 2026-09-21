import EventEmitter from '../utils/EventEmitter';

import { DEFAULTS, SERVICE_EVENTS } from '../utils/constants';
import { buildRegistrationMessage } from '../utils/messageBuilder';
import { diagLog } from '../env/diag';

/**
 * WebSocketManager
 *
 * Manages WebSocket connection lifecycle, including:
 * - Connection establishment
 * - Automatic reconnection (configurable attempts)
 * - Ping/Pong keepalive mechanism
 * - Message sending and receiving
 * - Connection state management
 *
 * States: connecting, connected, disconnected, error, reconnecting
 */
export default class WebSocketManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      socketUrl: config.socketUrl || '',
      channelUuid: config.channelUuid || '',
      host: config.host || '',
      sessionToken: config.sessionToken || null,
      autoReconnect:
        config.autoReconnect !== undefined
          ? config.autoReconnect
          : DEFAULTS.AUTO_RECONNECT,
      maxReconnectAttempts:
        config.maxReconnectAttempts || DEFAULTS.MAX_RECONNECT_ATTEMPTS,
      maxReclaimAttempts:
        config.maxReclaimAttempts || DEFAULTS.MAX_RECLAIM_ATTEMPTS,
      reconnectInterval:
        config.reconnectInterval || DEFAULTS.RECONNECT_INTERVAL,
      pingInterval: config.pingInterval || DEFAULTS.PING_INTERVAL,
      retryStrategy: config.retryStrategy || null,
      ...config,
    };

    this.socket = null;
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.isRegistered = false;
    this.registrationData = null;
    this.retryStrategy = this.config.retryStrategy;
    this.pendingAddToCartRequests = new Map();
    // Tracks consecutive "client from already exists" errors so we can stop
    // the reclaim handshake if the other client never releases the session.
    this._reclaimAttempts = 0;
  }

  /**
   * Establishes WebSocket connection
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.status === 'connected' || this.status === 'connecting') {
      return Promise.resolve();
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      try {
        this.status = 'connecting';
        this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, this.status);

        const socketHost = this.config.socketUrl.replace(/^(https?:|)\/\//, '');
        const url = `wss://${socketHost}/ws`;

        diagLog('[ws] opening', url, '| WebSocket type=', typeof WebSocket);
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          diagLog('[ws] onopen');
          this.register();
          this.once(SERVICE_EVENTS.CONNECTED, resolve);
        };

        this.socket.onmessage = (event) => {
          diagLog('[ws] onmessage', typeof event?.data === 'string' ? event.data.slice(0, 160) : '[non-string]');
          this._handleMessage(event);
        };

        this.socket.onerror = (error) => {
          diagLog('[ws] onerror', error && (error.message || error.type || 'error'));
          this.emit(SERVICE_EVENTS.ERROR, error);
        };

        this.socket.onclose = (event) => {
          diagLog('[ws] onclose code=' + (event?.code) + ' reason=' + (event?.reason || '') + ' clean=' + (event?.wasClean));
          this._handleDisconnect(event);
        };
      } catch (error) {
        this.status = 'error';
        this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, this.status);
        this.emit(SERVICE_EVENTS.ERROR, error);
        reject(error);
      }
    });
  }

  /**
   * Registers session with the server
   * Only registers once per connection, stores data for reconnection
   * @param {Object} data Registration data
   * @returns {Promise<void>}
   */
  async register() {
    if (
      this.isRegistered &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      return Promise.resolve();
    }

    const host =
      this.config.host || this.registrationData.host || 'https://flows.weni.ai';

    const message = buildRegistrationMessage(this.registrationData.from, {
      callback:
        this.registrationData.callback ||
        `${host}/c/wwc/${this.config.channelUuid}/receive`,
      session_type: this.registrationData.session_type || 'local',
      token:
        this.registrationData.token || this.config.sessionToken || undefined,
      data: {
        features: {
          voiceMode: !!this.config.voiceMode?.enabled,
        },
      },
    });

    return this.send(message)
      .then(() => {
        this.isRegistered = true;
        this.emit(SERVICE_EVENTS.WS_REGISTERED);
      })
      .catch((error) => {
        this.emit(
          SERVICE_EVENTS.ERROR,
          new Error('Registration failed: ' + error.message),
        );
        throw error;
      });
  }

  setRegistrationData(data) {
    this.registrationData = data;
  }

  isContactAllowedToBeClosed() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Contact timeout'));
      }, 30 * 1000);

      this.once(SERVICE_EVENTS.CONTACT_TIMEOUT_ERROR, (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.once(SERVICE_EVENTS.CONTACT_TIMEOUT_ALLOWED_TO_CLOSE, () => {
        clearTimeout(timeout);
        resolve();
      });

      const message = {
        type: 'verify_contact_timeout',
      };

      this.send(message);
    });
  }

  /**
   * Requests single-use voice tokens from the server.
   * Resolves with { sttToken, ttsToken } or rejects on error/timeout.
   *
   * @param {number} [timeoutMs=10000]
   * @returns {Promise<{ sttToken: string, ttsToken: string }>}
   */
  requestVoiceTokens(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      // `settled` only guards the send().catch path, which can fire after a
      // synchronous settle (timeout/event) has already cleaned up. The timer
      // and once-listeners cannot run after cleanup(), so they don't need
      // their own guards.
      let settled = false;

      const timer = setTimeout(() => {
        settled = true;
        cleanup();
        reject(new Error('Voice tokens request timed out'));
      }, timeoutMs);

      const onReceived = (data) => {
        settled = true;
        cleanup();
        const tokens = data.data || data;
        resolve({ sttToken: tokens.stt_token, ttsToken: tokens.tts_token });
      };

      const onError = (data) => {
        settled = true;
        cleanup();
        reject(new Error(data.error || 'Failed to get voice tokens'));
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.off(SERVICE_EVENTS.VOICE_TOKENS_RECEIVED, onReceived);
        this.off(SERVICE_EVENTS.VOICE_TOKENS_ERROR, onError);
      };

      this.once(SERVICE_EVENTS.VOICE_TOKENS_RECEIVED, onReceived);
      this.once(SERVICE_EVENTS.VOICE_TOKENS_ERROR, onError);

      this.send({ type: 'request_voice_tokens' }).catch((err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      });
    });
  }

  /**
   * Requests the backend to add an item to the VTEX cart.
   * Supports concurrent requests by correlating responses using item id.
   *
   * @param {Object} props
   * @param {string} props.VTEXAccountName
   * @param {string} props.orderFormId
   * @param {string} props.seller
   * @param {string} props.id
   * @param {number} [timeoutMs=30000]
   * @returns {Promise<{ id: string }>}
   */
  addProductToCart(props, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const { VTEXAccountName, orderFormId, seller, id: itemId } = props || {};

      if (!VTEXAccountName || typeof VTEXAccountName !== 'string') {
        reject(new Error('VTEXAccountName is required'));
        return;
      }

      if (!orderFormId || typeof orderFormId !== 'string') {
        reject(new Error('orderFormId is required'));
        return;
      }

      if (!seller || typeof seller !== 'string') {
        reject(new Error('seller is required'));
        return;
      }

      if (!itemId || typeof itemId !== 'string') {
        reject(new Error('id is required'));
        return;
      }

      if (this.pendingAddToCartRequests.has(itemId)) {
        reject(
          new Error(
            `An add-to-cart request is already pending for item id "${itemId}"`,
          ),
        );
        return;
      }

      const timer = setTimeout(() => {
        this.pendingAddToCartRequests.delete(itemId);
        reject(
          new Error(`Add to cart request timed out for item id "${itemId}"`),
        );
      }, timeoutMs);

      this.pendingAddToCartRequests.set(itemId, {
        resolve,
        reject,
        timer,
      });

      this.send({
        type: 'add_to_cart',
        data: {
          vtex_account: VTEXAccountName,
          order_form_id: orderFormId,
          item: {
            seller,
            id: itemId,
          },
        },
      }).catch((err) => {
        const pending = this.pendingAddToCartRequests.get(itemId);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pendingAddToCartRequests.delete(itemId);
        reject(err);
      });
    });
  }

  async _handleReadyForMessage(data = {}) {
    this.status = 'connected';

    this.reconnectAttempts = 0;
    this._reclaimAttempts = 0;

    if (this.retryStrategy) {
      this.retryStrategy.reset();
    }

    if (data.data?.voice_enabled) {
      this.emit(SERVICE_EVENTS.VOICE_ENABLED);
    }

    this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, this.status);
    this.emit(SERVICE_EVENTS.CONNECTED);
    this._startPingInterval();
    this._requestProjectLanguage();
  }

  _requestProjectLanguage() {
    const message = {
      type: 'get_project_language',
    };

    return this.send(message);
  }

  async _closeOthersConnections() {
    const message = {
      type: 'close_session',
      from: this.registrationData.from,
    };

    try {
      await this.send(message);

      // Non-permanent disconnect keeps autoReconnect=true and sets
      // status='disconnecting' so _handleDisconnect schedules the reconnect
      // through the capped path. Avoids the unbounded loop and the latent
      // side effect of silently turning off autoReconnect forever.
      this.disconnect(false, 'disconnecting');
    } catch (error) {
      this.emit(
        SERVICE_EVENTS.ERROR,
        new Error('Failed to close connection: ' + error.message),
      );
      throw error;
    }
  }

  /**
   * Sends a message through WebSocket
   * Waits for connection if socket is connecting
   * @param {Object} message Message object
   * @returns {Promise<void>}
   */
  send(message) {
    diagLog('[ws] send', message && message.type ? message.type : typeof message,
      message && message.message && message.message.text ? '"' + String(message.message.text).slice(0, 40) + '"' : '');
    return new Promise((resolve, reject) => {
      // If socket is ready, send immediately
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify(message));
          this.emit(SERVICE_EVENTS.MESSAGE_SENT, message);
          resolve();
        } catch (error) {
          this.emit(SERVICE_EVENTS.ERROR, error);
          reject(error);
        }
        return;
      }

      // If socket is connecting, wait for it to open
      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        const onOpen = () => {
          try {
            this.socket.send(JSON.stringify(message));
            this.emit(SERVICE_EVENTS.MESSAGE_SENT, message);
            cleanup();
            resolve();
          } catch (error) {
            cleanup();
            this.emit(SERVICE_EVENTS.ERROR, error);
            reject(error);
          }
        };

        const onError = (error) => {
          cleanup();
          this.emit(SERVICE_EVENTS.ERROR, error);
          reject(error);
        };

        const onClose = () => {
          cleanup();
          reject(new Error('WebSocket closed before message could be sent'));
        };

        const cleanup = () => {
          this.socket?.removeEventListener('open', onOpen);
          this.socket?.removeEventListener('error', onError);
          this.socket?.removeEventListener('close', onClose);
        };

        this.socket.addEventListener('open', onOpen);
        this.socket.addEventListener('error', onError);
        this.socket.addEventListener('close', onClose);
        return;
      }

      // Socket is closed or doesn't exist
      reject(new Error('WebSocket not connected'));
    });
  }

  /**
   * Disconnects WebSocket
   * @param {boolean} permanent If true, prevents reconnection
   */
  disconnect(permanent = true, status = 'disconnecting') {
    if (permanent) {
      this.config.autoReconnect = false;
    }

    this._stopPingInterval();
    this._stopReconnectTimer();

    if (this.socket) {
      this.socket.close();
    }

    this.status = status;
    this.isRegistered = false;
    this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, this.status);

    if (permanent) {
      this.emit(SERVICE_EVENTS.DISCONNECTED);
    }
  }

  /**
   * Gets current connection status
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Handles incoming WebSocket messages
   * @private
   */
  _handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'pong') {
        return;
      }

      if (data.type === 'ready_for_message') {
        this._handleReadyForMessage(data);
        return;
      }

      if (data.type === 'allow_contact_timeout') {
        this.emit(SERVICE_EVENTS.CONTACT_TIMEOUT_ALLOWED_TO_CLOSE);
        return;
      }

      if (data.type === 'project_language') {
        this.emit(SERVICE_EVENTS.LANGUAGE_CHANGED, data.data.language);
        return;
      }

      if (data.type === 'starters') {
        this.emit(SERVICE_EVENTS.STARTERS_RECEIVED, data.data);
        return;
      }

      if (data.type === 'voice_tokens') {
        this.emit(SERVICE_EVENTS.VOICE_TOKENS_RECEIVED, data);
        return;
      }

      if (data.type === 'voice_tokens_error') {
        this.emit(SERVICE_EVENTS.VOICE_TOKENS_ERROR, data);
        return;
      }

      if (data.type === 'cart_updated') {
        const itemId = data?.data?.item_id;

        if (itemId && this.pendingAddToCartRequests.has(itemId)) {
          const pending = this.pendingAddToCartRequests.get(itemId);
          clearTimeout(pending.timer);
          this.pendingAddToCartRequests.delete(itemId);
          pending.resolve({ id: itemId });
        }

        this.emit(SERVICE_EVENTS.CART_UPDATED, data);
        return;
      }

      if (data.type === 'cart_error') {
        const itemId = data?.data?.item_id;

        if (itemId && this.pendingAddToCartRequests.has(itemId)) {
          const pending = this.pendingAddToCartRequests.get(itemId);
          clearTimeout(pending.timer);
          this.pendingAddToCartRequests.delete(itemId);
          const errMsg =
            typeof data.error === 'string' && data.error.trim()
              ? data.error.trim()
              : 'Failed to update cart';
          pending.reject(new Error(errMsg));
        }

        return;
      }

      if (
        data.type === 'error' &&
        String(data.error).startsWith('verify contact timeout: ')
      ) {
        this.emit(
          SERVICE_EVENTS.CONTACT_TIMEOUT_ERROR,
          new Error(data.error.slice('verify contact timeout: '.length)),
        );

        return;
      }

      if (
        data.type === 'error' &&
        data.error === 'unable to register: client from already exists'
      ) {
        this._reclaimAttempts += 1;
        if (this._reclaimAttempts > this.config.maxReclaimAttempts) {
          this.emit(
            SERVICE_EVENTS.ERROR,
            new Error('Unable to reclaim session from another active client'),
          );
          this.disconnect(true);
          return;
        }
        this._closeOthersConnections();
        return;
      }

      if (
        data.type === 'warning' &&
        data.warning === 'Connection closed by request'
      ) {
        this.disconnect(true, 'closed');
        return;
      }

      if (
        data.type === 'error' &&
        typeof data.error === 'string' &&
        data.error.startsWith('unable to register: original handler is dead')
      ) {
        // Backend removed the stale record and invites us to retry.
        // Non-permanent disconnect triggers the capped reconnect path,
        // which re-registers. If for any reason the record persists,
        // _scheduleReconnect's cap stops the loop.
        this.isRegistered = false;
        this.disconnect(false, 'disconnecting');
        return;
      }

      if (data.type === 'error') {
        const errorMsg = data.error || 'Unknown server error';

        if (errorMsg.includes('starters')) {
          this.emit(SERVICE_EVENTS.STARTERS_ERROR, { error: errorMsg });
        }

        this.emit(SERVICE_EVENTS.ERROR, new Error(errorMsg));

        if (
          errorMsg.includes('unable to register') ||
          errorMsg.includes('already exists')
        ) {
          this.isRegistered = false;
        }
        return;
      }

      this.emit(SERVICE_EVENTS.MESSAGE, data);
    } catch (error) {
      this.emit(
        SERVICE_EVENTS.ERROR,
        new Error('Failed to parse message: ' + error.message),
      );
    }
  }

  /**
   * Handles WebSocket disconnection
   * @private
   */
  _handleDisconnect(event) {
    const wasConnected = this.status === 'connected';
    const wasDisconnecting = this.status === 'disconnecting';
    const wasClosed = this.status === 'closed';

    this.status = 'disconnected';
    this.isRegistered = false;
    this._stopPingInterval();

    if (!wasClosed) {
      this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, this.status);
      this.emit(SERVICE_EVENTS.DISCONNECTED);
    }

    // Only attempt reconnection if we were connected or disconnecting and autoReconnect is enabled
    if (
      (wasConnected || wasDisconnecting) &&
      this.config.autoReconnect &&
      this.reconnectAttempts < this.config.maxReconnectAttempts
    ) {
      this._scheduleReconnect();
    }
  }

  /**
   * Schedules reconnection attempt
   * Uses RetryStrategy if available for exponential backoff with jitter
   * @private
   */
  _scheduleReconnect() {
    // Defensive cap: every caller goes through this method, so enforcing the
    // max-attempts guard here prevents any direct caller (e.g. duplicate
    // session recovery) from bypassing _handleDisconnect's check and looping.
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit(
        SERVICE_EVENTS.ERROR,
        new Error('Max reconnection attempts reached'),
      );
      return;
    }

    this.status = 'reconnecting';
    this.emit(SERVICE_EVENTS.CONNECTION_STATUS_CHANGED, this.status);

    // Calculate delay using retry strategy or fallback to fixed interval
    const delay = this.retryStrategy
      ? this.retryStrategy.next()
      : this.config.reconnectInterval;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      this.emit(SERVICE_EVENTS.RECONNECTING, this.reconnectAttempts);

      try {
        await this.connect(this.registrationData);
      } catch (error) {
        // Error handled in connect()
      }
    }, delay);
  }

  /**
   * Starts ping interval to keep connection alive
   * @private
   */
  _startPingInterval() {
    this._stopPingInterval();

    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.pingInterval);
  }

  /**
   * Stops ping interval
   * @private
   */
  _stopPingInterval() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Stops reconnect timer
   * @private
   */
  _stopReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
