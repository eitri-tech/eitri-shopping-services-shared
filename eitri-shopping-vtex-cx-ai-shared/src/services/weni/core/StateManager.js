import EventEmitter from '../utils/EventEmitter';

import { SERVICE_EVENTS } from '../utils/constants';

/**
 * StateManager
 *
 * Manages global application state:
 * - Messages array
 * - Session data
 * - Connection state
 * - Context string
 * - UI state (typing, etc.)
 *
 * Uses EventEmitter to notify subscribers of state changes
 */
export default class StateManager extends EventEmitter {
  constructor() {
    super();

    this.state = {
      messages: [],
      session: {},
      connection: {
        status: 'disconnected',
        reconnectAttempts: 0,
        lastError: null,
      },
      context: '',
      isTyping: false,
      isThinking: false,
      error: null,
    };
  }

  /**
   * Updates state and emits change event
   * @param {Object} updates Partial state updates
   */
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    this.emit(SERVICE_EVENTS.STATE_CHANGED, this.state, oldState);

    // Emit specific change events
    Object.keys(updates).forEach((key) => {
      if (oldState[key] !== this.state[key]) {
        this.emit(`state:${key}:changed`, this.state[key], oldState[key]);
      }
    });
  }

  /**
   * Gets current state
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Gets specific state property
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Adds a message to state
   * @param {Object} message
   */
  addMessage(message) {
    const messages = [...this.state.messages, message];
    this.setState({ messages });
    this.emit(SERVICE_EVENTS.MESSAGE_ADDED, message);
  }

  /**
   * Updates a message in state
   * @param {string} messageId
   * @param {Object} updates
   */
  updateMessage(messageId, updates) {
    const messages = this.state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg,
    );

    this.setState({ messages });
    this.emit(SERVICE_EVENTS.MESSAGE_UPDATED, messageId, updates);
  }

  /**
   * Removes a message from state
   * @param {string} messageId
   */
  removeMessage(messageId) {
    const messages = this.state.messages.filter((msg) => msg.id !== messageId);
    this.setState({ messages });
    this.emit(SERVICE_EVENTS.MESSAGE_REMOVED, messageId);
  }

  /**
   * Clears all messages
   */
  clearMessages() {
    this.setState({ messages: [] });
    this.emit(SERVICE_EVENTS.MESSAGES_CLEARED);
  }

  /**
   * Sets connection status
   * @param {string} status
   * @param {Object} details
   */
  setConnectionStatus(status, details = {}) {
    const connection = {
      ...this.state.connection,
      status,
      ...details,
    };

    this.setState({ connection });
  }

  /**
   * Sets session data
   * @param {Object} session
   */
  setSession(session) {
    this.setState({
      session,
      messages: session.conversation,
    });
  }

  /**
   * Sets context
   * @param {string} context
   */
  setContext(context) {
    this.setState({ context });
  }

  /**
   * Gets context
   * @returns {string}
   */
  getContext() {
    return this.state.context;
  }

  /**
   * Sets typing indicator
   * @param {boolean} isTyping
   */
  setTyping(isTyping) {
    this.setState({ isTyping });
  }

  /**
   * Sets thinking indicator
   * @param {boolean} isThinking
   */
  setThinking(isThinking) {
    this.setState({ isThinking });
  }

  /**
   * Sets error state
   * @param {Error|string|null} error
   */
  setError(error) {
    this.setState({
      error: error instanceof Error ? error : error ? new Error(error) : null,
    });
  }

  /**
   * Clears error state
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Resets state to initial values
   */
  reset() {
    this.state = {
      messages: [],
      session: {},
      connection: {
        status: 'disconnected',
        reconnectAttempts: 0,
        lastError: null,
      },
      context: '',
      isTyping: false,
      isThinking: false,
      error: null,
    };

    this.emit(SERVICE_EVENTS.STATE_RESET);
  }

  /**
   * Gets messages
   * @returns {Array}
   */
  getMessages() {
    return [...this.state.messages];
  }

  /**
   * Gets message by ID
   * @param {string} messageId
   * @returns {Object|undefined}
   */
  getMessage(messageId) {
    return this.state.messages.find((msg) => msg.id === messageId);
  }
}
