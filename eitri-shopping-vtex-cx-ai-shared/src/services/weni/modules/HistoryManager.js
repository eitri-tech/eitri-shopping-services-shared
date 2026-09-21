import EventEmitter from '../utils/EventEmitter';
import { SERVICE_EVENTS } from '../utils/constants';

/**
 * @class HistoryManager
 * @extends EventEmitter
 * @description Manages conversation history retrieval, processing, and merging.
 *
 * Features from monolith:
 * - Fetch history from server via WebSocket
 * - Merge history with local messages (deduplication)
 * - Sort messages by timestamp
 * - Pagination support
 */
export default class HistoryManager extends EventEmitter {
  /**
   * @param {import('../core/WebSocketManager').default} websocket - WebSocket manager instance
   * @param {Object} [config={}] - Configuration options
   */
  constructor(websocket, config = {}) {
    super();

    this.websocket = websocket;
    this.config = {
      defaultLimit: config.defaultLimit || 20,
      defaultPage: config.defaultPage || 1,
      ...config,
    };

    /**
     * @private
     * @type {boolean}
     */
    this.loading = false;

    /**
     * @private
     * @type {import('../types').Message[]}
     */
    this.cachedHistory = [];

    this._registerSocketEventListeners();
  }

  _registerSocketEventListeners() {
    this.websocket.on(SERVICE_EVENTS.MESSAGE, (message) => {
      if (message.type === 'history') {
        this.emit(SERVICE_EVENTS.HISTORY_RESPONSE, message.history);
      }
    });
  }

  /**
   * Requests conversation history from the server.
   * Sends a WebSocket message to fetch history.
   *
   * @param {import('../types').HistoryOptions} [options={}] - History request options
   * @returns {Promise<import('../types').Message[]>} Array of history messages
   */
  async request(options = {}) {
    if (this.loading) {
      throw new Error('History request already in progress');
    }

    this.loading = true;
    this.emit(SERVICE_EVENTS.HISTORY_LOADING_START);

    try {
      const payload = {
        type: 'get_history',
        params: {
          limit: options.limit || this.config.defaultLimit,
          page: options.page || this.config.defaultPage,
          before: options.before,
          after: options.after,
        },
      };

      this.websocket.send(payload);

      this.emit(SERVICE_EVENTS.HISTORY_REQUESTED, payload);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.loading = false;
          this.emit(SERVICE_EVENTS.HISTORY_LOADING_END);
          reject(new Error('History request timeout'));
        }, 30 * 1000);

        const handleHistory = (history) => {
          clearTimeout(timeout);
          this.loading = false;
          const processedHistory = this.processHistory(history);
          this.emit(SERVICE_EVENTS.HISTORY_LOADING_END);
          this.emit(SERVICE_EVENTS.HISTORY_LOADED, processedHistory);
          resolve(processedHistory);
        };

        this.once(SERVICE_EVENTS.HISTORY_RESPONSE, handleHistory);
      });
    } catch (error) {
      this.loading = false;
      this.emit(SERVICE_EVENTS.HISTORY_LOADING_END);
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Processes raw history data from the server.
   * Normalizes message structure from monolith format.
   *
   * @param {Array} rawHistory - Raw history data from server
   * @returns {import('../types').Message[]} Normalized messages
   */
  processHistory(rawHistory) {
    if (!Array.isArray(rawHistory)) {
      return [];
    }

    return rawHistory.map((item) => {
      // Normalize message structure
      const message = {
        id: item.ID || item.id,
        type: item.message?.type || 'text',
        timestamp: item.timestamp * 1e3 || Date.now(),
        direction: this._normalizeDirection(item.direction),
        sender: item.direction === 'in' ? 'response' : 'client',
      };

      if (item.message?.type === 'text') {
        message.text = item.message.text;
      }

      if (item.message?.media_url) {
        message.media = item.message.media_url;
        message.caption = item.message.caption;
      }

      if (item.message?.quick_replies) {
        message.quick_replies = item.message.quick_replies;
      }

      if (item.message?.list_message?.list_items?.length >= 1) {
        message.list_message = item.message.list_message;
      }

      if (item.message?.type === 'interactive') {
        const { interactive } = item.message;
        message.text = item.message.text;

        if (interactive?.header) {
          message.header = interactive.header.text;
        }

        if (interactive?.footer) {
          message.footer = interactive.footer.text;
        }

        if (interactive?.type === 'product_list') {
          message.product_list = {
            text: message.text,
            buttonText: interactive.action?.name,
            sections: interactive.action?.sections,
          };
        }
      }

      if (item.message?.type === 'order') {
        message.order = {
          product_items: item.message.order.product_items,
        };
      }

      return message;
    });
  }

  /**
   * Merges history messages with current local messages.
   * Removes duplicates and sorts by timestamp.
   *
   * From monolith:
   * - Deduplicates based on message ID
   * - Sorts by timestamp (oldest first)
   * - Removes temporary messages without IDs
   *
   * @param {import('../types').Message[]} historyMessages - Messages from history
   * @param {import('../types').Message[]} currentMessages - Current local messages
   * @returns {import('../types').Message[]} Merged and sorted messages
   */
  merge(historyMessages, currentMessages) {
    // Create a map of existing messages by ID for fast lookup
    const messageMap = new Map();

    // Add current messages to map (prioritize local messages)
    currentMessages.forEach((msg) => {
      if (msg.id || msg.ID) {
        const id = msg.id || msg.ID;
        messageMap.set(id, msg);
      }
    });

    // Add history messages (skip if already exists)
    historyMessages.forEach((msg) => {
      if (msg.id || msg.ID) {
        const id = msg.id || msg.ID;
        if (!messageMap.has(id)) {
          messageMap.set(id, msg);
        }
      }
    });

    // Convert map back to array and sort by timestamp
    const merged = Array.from(messageMap.values());

    // Sort by timestamp (oldest first)
    merged.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeA - timeB;
    });

    this.emit(SERVICE_EVENTS.HISTORY_MERGED, {
      historyCount: historyMessages.length,
      currentCount: currentMessages.length,
      mergedCount: merged.length,
    });

    return merged;
  }

  /**
   * Finds the correct insertion position for a message based on timestamp.
   * Used when inserting individual history messages.
   *
   * From monolith: findInsertionPosition()
   *
   * @param {import('../types').Message} newMessage - Message to insert
   * @param {import('../types').Message[]} messages - Existing messages
   * @returns {number} Index where message should be inserted
   */
  findInsertionPosition(newMessage, messages) {
    const newTimestamp = newMessage.timestamp || Date.now();

    for (let i = 0; i < messages.length; i++) {
      const currentTimestamp = messages[i].timestamp || 0;
      if (currentTimestamp > newTimestamp) {
        return i;
      }
    }

    return messages.length;
  }

  /**
   * Checks if a message already exists in the current messages.
   * Used for deduplication.
   *
   * From monolith: getUniqueNewItems()
   *
   * @param {import('../types').Message} newMessage - Message to check
   * @param {import('../types').Message[]} messages - Existing messages
   * @returns {boolean} True if message is unique (doesn't exist)
   */
  isUnique(newMessage, messages) {
    const newId = newMessage.id || newMessage.ID;

    if (!newId) {
      return true;
    }

    return !messages.some((msg) => {
      const msgId = msg.id || msg.ID;
      return msgId === newId;
    });
  }

  /**
   * Removes messages without IDs (temporary local messages).
   * Used when history is loaded to clean up optimistic UI updates.
   *
   * From monolith: getPositionsWithoutId()
   *
   * @param {import('../types').Message[]} messages - Messages to filter
   * @returns {import('../types').Message[]} Messages with valid IDs
   */
  removeTemporaryMessages(messages) {
    return messages.filter((msg) => msg.id || msg.ID);
  }

  /**
   * Clears cached history.
   */
  clearCache() {
    this.cachedHistory = [];
    this.emit(SERVICE_EVENTS.HISTORY_CACHE_CLEARED);
  }

  /**
   * Gets loading state.
   *
   * @returns {boolean}
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Normalizes direction values from server.
   *
   * @private
   * @param {string} direction - Direction from server ('in' or 'out')
   * @returns {'incoming' | 'outgoing'}
   */
  _normalizeDirection(direction) {
    if (direction === 'in') return 'incoming';
    if (direction === 'out') return 'outgoing';
    return direction;
  }
}
