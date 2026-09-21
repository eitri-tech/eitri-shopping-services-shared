import { generateSessionId } from '../utils/helpers';
import EventEmitter from '../utils/EventEmitter';
import { SERVICE_EVENTS } from '../utils/constants';

/**
 * SessionManager
 *
 * Manages user sessions with features:
 * - Generate unique session IDs in format: timestamp@hostname
 * - Persist sessions in localStorage/sessionStorage
 * - Restore existing sessions
 * - Clear sessions
 * - Auto-clear cache after timeout
 * - Contact timeout management
 * - Track whether user has sent any message
 */
export default class SessionManager extends EventEmitter {
  constructor(storage, config = {}) {
    super();
    this.storage = storage;
    this.config = {
      autoClearCache: config.autoClearCache !== false,
      cacheTimeout: config.cacheTimeout || 30 * 60 * 1000, // 30 minutes
      contactTimeout: config.contactTimeout || 24 * 60, // 24 hours in minutes
      clientId: config.clientId || null,
      sessionId: config.sessionId || null,
    };

    this.sessionKey = 'weni:aichat:session';
    this.session = null;
    this.clearTimer = null;
    this.contactTimeoutTimer = null;
  }

  /**
   * Gets existing session or creates a new one
   * @returns {string} Session ID
   */
  getOrCreate() {
    if (this.session && this.session.id) {
      return this.session.id;
    }

    const stored = this.storage.get(this.sessionKey);

    if (stored && this._isSessionValid(stored)) {
      this.session = stored;
      this._updateLastActivity();
      return this.session.id;
    }

    return this.createNewSession();
  }

  /**
   * Restores session from storage
   * @returns {Promise<Object|null>}
   */
  async restore() {
    const stored = this.storage.get(this.sessionKey);

    if (stored && this._isSessionValid(stored)) {
      this.session = stored;
      this._updateLastActivity();
      this._startAutoClearTimer();
      this._scheduleContactTimeoutCheck();
      return this.session;
    }

    return null;
  }

  /**
   * Gets current session
   * @returns {Object|null}
   */
  getSession() {
    return this.session;
  }

  /**
   * Gets session ID
   * @returns {string|null}
   */
  getSessionId() {
    return this.session ? this.session.id : null;
  }

  /**
   * Sets session ID for future session creation
   * @param {string} sessionId
   */
  setSessionId(sessionId) {
    this.config.sessionId = sessionId;
  }

  /**
   * Updates session metadata
   * @param {Object} metadata
   */
  updateMetadata(metadata = {}) {
    if (!this.session) {
      return;
    }

    this.session.metadata = {
      ...this.session.metadata,
      ...metadata,
    };

    this._updateLastActivity();
    this._save();
  }

  /**
   * Clears current session
   */
  clear() {
    this.session = null;
    this.storage.remove(this.sessionKey);
    this._stopAutoClearTimer();
    this._clearContactTimeoutTimer();
  }

  /**
   * Creates a new session
   * @private
   * @returns {string} Session ID
   */
  createNewSession() {
    const now = Date.now();

    const id = this.config.sessionId || generateSessionId(this.config.clientId);

    this.session = {
      id,
      createdAt: now,
      lastActivity: now,
      lastMessageSentAt: null,
      hasSentAnyMessage: false,
      pendingCustomFields: {},
      isChatOpen: false,
      metadata: {},
      conversation: [],
    };

    this._save();
    this._startAutoClearTimer();
    this._scheduleContactTimeoutCheck();

    return this.session.id;
  }

  /**
   * Sets the timestamp of the last message successfully sent
   * @param {number} [timestamp]
   */
  setLastMessageSentAt(timestamp = Date.now()) {
    if (!this.session) {
      return;
    }

    this.session.lastMessageSentAt = timestamp;
    this.session.hasSentAnyMessage = true;
    this._save();
    this._scheduleContactTimeoutCheck();
  }

  /**
   * Returns whether the user has sent any message
   * @returns {boolean}
   */
  hasUserSentAnyMessage() {
    return this.session ? Boolean(this.session.hasSentAnyMessage) : false;
  }

  /**
   * Sets whether the user has sent any kind of message (text, audio, file, etc.)
   * @param {boolean} value
   */
  setHasSentAnyMessage(value = true) {
    if (!this.session) {
      return;
    }
    this.session.hasSentAnyMessage = Boolean(value);
    this._updateLastActivity();
    this._save();
  }

  /**
   * Checks if session is still valid
   * @private
   * @param {Object} session
   * @returns {boolean}
   */
  _isSessionValid(session) {
    if (!session || !session.id || !session.lastActivity) {
      return false;
    }

    if (!session.lastMessageSentAt) {
      return true; // If no message has been sent, the session is valid
    }

    const now = Date.now();
    const elapsedSinceLastMessageSent = now - session.lastMessageSentAt;

    return elapsedSinceLastMessageSent < this._getContactTimeoutMs();
  }

  /**
   * Updates last activity timestamp
   * @private
   */
  _updateLastActivity() {
    if (!this.session) {
      return;
    }

    this.session.lastActivity = Date.now();
    this._save();
  }

  /**
   * Calculates contact timeout in milliseconds based on config (minutes)
   * @private
   */
  _getContactTimeoutMs() {
    return (this.config.contactTimeout || 0) * 60 * 1000;
  }

  /**
   * Schedules or reschedules the contact-timeout check based on lastMessageSentAt
   * Emits "maximum contact time atigindo" when reached
   * @private
   */
  _scheduleContactTimeoutCheck() {
    this._clearContactTimeoutTimer();

    if (!this.session || !this.session.lastMessageSentAt) {
      return;
    }

    const timeoutMs = this._getContactTimeoutMs();
    if (!timeoutMs || timeoutMs <= 0) {
      return;
    }

    const targetAt = this.session.lastMessageSentAt + timeoutMs;
    const delay = targetAt - Date.now();

    if (delay <= 0) {
      this.emit(SERVICE_EVENTS.CONTACT_TIMEOUT_MAXIMUM_TIME_REACHED);
      return;
    }

    this.contactTimeoutTimer = setTimeout(() => {
      this.emit(SERVICE_EVENTS.CONTACT_TIMEOUT_MAXIMUM_TIME_REACHED);
      this._clearContactTimeoutTimer();
    }, delay);
  }

  /**
   * Clears the contact-timeout timer
   * @private
   */
  _clearContactTimeoutTimer() {
    if (this.contactTimeoutTimer) {
      clearTimeout(this.contactTimeoutTimer);
      this.contactTimeoutTimer = null;
    }
  }

  /**
   * Returns the conversation array from session
   * @returns {Array}
   */
  getConversation() {
    if (!this.session) return [];
    if (!Array.isArray(this.session.conversation)) {
      this.session.conversation = [];
    }
    return this.session.conversation;
  }

  /**
   * Sets the entire conversation array and persists
   * @param {Array} messages
   */
  setConversation(messages) {
    if (!this.session) return;
    this.session.conversation = Array.isArray(messages) ? messages : [];
    this._updateLastActivity();
    this._save();
  }

  /**
   * Appends one message to the conversation and persists
   * @param {any} message
   * @param {{ limit?: number }} [options]
   */
  appendToConversation(message, options = {}) {
    if (!this.session) return;
    const limit = typeof options.limit === 'number' ? options.limit : undefined;
    const list = this.getConversation();
    list.push(message);
    if (limit && limit > 0 && list.length > limit) {
      list.splice(0, list.length - limit);
    }
    this.session.conversation = list;
    this._updateLastActivity();
    this._save();
  }

  /**
   * Updates a message in the conversation
   * @param {string} messageId
   * @param {Object} update
   */
  updateConversation(messageId, update) {
    if (!this.session) return;
    const list = this.getConversation();
    const message = list.find((m) => m.id === messageId);
    if (message) {
      Object.assign(message, update);
    }
    this._save();
  }

  /**
   * Saves session to storage
   * @private
   */
  _save() {
    if (!this.session) {
      return;
    }

    // Backfill missing fields for older sessions
    if (typeof this.session.isChatOpen === 'undefined') {
      this.session.isChatOpen = false;
    }
    if (typeof this.session.hasSentAnyMessage === 'undefined') {
      this.session.hasSentAnyMessage = Boolean(this.session.lastMessageSentAt);
    }
    if (typeof this.session.pendingCustomFields === 'undefined') {
      this.session.pendingCustomFields = {};
    }

    this.storage.set(this.sessionKey, this.session);
  }

  /**
   * Returns pending custom fields set before first message
   * @returns {Record<string, any>}
   */
  getPendingCustomFields() {
    if (!this.session) return {};
    const fields = this.session.pendingCustomFields || {};
    return typeof fields === 'object' && fields !== null ? fields : {};
  }

  /**
   * Adds or updates a pending custom field
   * @param {string} key
   * @param {any} value
   */
  addPendingCustomField(key, value) {
    if (!this.session) return;
    if (
      typeof this.session.pendingCustomFields !== 'object' ||
      this.session.pendingCustomFields === null
    ) {
      this.session.pendingCustomFields = {};
    }
    this.session.pendingCustomFields[key] = value;
    this._updateLastActivity();
    this._save();
  }

  /**
   * Clears all pending custom fields
   */
  clearPendingCustomFields() {
    if (!this.session) return;
    this.session.pendingCustomFields = {};
    this._updateLastActivity();
    this._save();
  }

  /**
   * Sets whether the chat widget is open
   * @param {boolean} isOpen
   */
  setIsChatOpen(isOpen) {
    if (!this.session) return;
    this.session.isChatOpen = Boolean(isOpen);
    this._updateLastActivity();
    this._save();
    this.emit(SERVICE_EVENTS.CHAT_OPEN_CHANGED, this.session.isChatOpen);
  }

  /**
   * Returns whether the chat widget is open
   * @returns {boolean}
   */
  getIsChatOpen() {
    return this.session ? Boolean(this.session.isChatOpen) : false;
  }

  /**
   * Starts auto-clear timer
   * @private
   */
  _startAutoClearTimer() {
    if (!this.config.autoClearCache) {
      return;
    }

    this._stopAutoClearTimer();

    this.clearTimer = setTimeout(() => {
      this.clear();
    }, this.config.cacheTimeout);
  }

  /**
   * Stops auto-clear timer
   * @private
   */
  _stopAutoClearTimer() {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
  }
}
