/**
 * StorageManager
 *
 * Abstraction layer for browser storage:
 * - localStorage / sessionStorage support
 * - JSON serialization/deserialization
 * - Data versioning for migrations
 * - Safe error handling
 *
 * Eitri adaptation: the backing store is resolved through getWebStorage(), which
 * returns the WebView's native Storage when usable or a synchronous in-memory
 * fallback otherwise. Durability across app launches is provided by mirroring to
 * Eitri.sharedStorage (see env/EitriEnv.js). The rest of this class is verbatim.
 */
import { getWebStorage } from '../env/EitriEnv';

export default class StorageManager {
  constructor(type = 'local') {
    this.type = type;
    this.storage = getWebStorage(type);
    this.version = '1.0.0';
    this.prefix = 'weni:aichat:';
  }

  /**
   * Gets item from storage
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    try {
      const fullKey = this._getFullKey(key);
      const item = this.storage.getItem(fullKey);

      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);

      // Check version and migrate if needed
      if (parsed._version && parsed._version !== this.version) {
        return this._migrate(parsed);
      }

      return parsed._data !== undefined ? parsed._data : parsed;
    } catch (error) {
      console.error('StorageManager: Failed to get item', error);
      return null;
    }
  }

  /**
   * Sets item in storage
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    try {
      const fullKey = this._getFullKey(key);
      const data = {
        _version: this.version,
        _timestamp: Date.now(),
        _data: value,
      };

      this.storage.setItem(fullKey, JSON.stringify(data));
    } catch (error) {
      console.error('StorageManager: Failed to set item', error);

      if (error.name === 'QuotaExceededError') {
        this._handleQuotaExceeded();
      }
    }
  }

  /**
   * Removes item from storage
   * @param {string} key
   */
  remove(key) {
    try {
      const fullKey = this._getFullKey(key);
      this.storage.removeItem(fullKey);
    } catch (error) {
      console.error('StorageManager: Failed to remove item', error);
    }
  }

  /**
   * Clears all storage items with prefix
   */
  clear() {
    try {
      const keys = this._getAllKeys();
      keys.forEach((key) => this.storage.removeItem(key));
    } catch (error) {
      console.error('StorageManager: Failed to clear storage', error);
    }
  }

  /**
   * Checks if key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const fullKey = this._getFullKey(key);
    return this.storage.getItem(fullKey) !== null;
  }

  /**
   * Gets all keys with prefix
   * @returns {Array<string>}
   */
  keys() {
    return this._getAllKeys().map((key) => key.replace(this.prefix, ''));
  }

  /**
   * Gets storage size in bytes (approximate)
   * @returns {number}
   */
  getSize() {
    let size = 0;
    const keys = this._getAllKeys();

    keys.forEach((key) => {
      const item = this.storage.getItem(key);
      if (item) {
        size += item.length + key.length;
      }
    });

    return size;
  }

  /**
   * Gets full storage key with prefix
   * @private
   * @param {string} key
   * @returns {string}
   */
  _getFullKey(key) {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
  }

  /**
   * Gets all keys with prefix
   * @private
   * @returns {Array<string>}
   */
  _getAllKeys() {
    const keys = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Migrates data from old version
   * @private
   * @param {Object} data
   * @returns {any}
   */
  _migrate(data) {
    // Migration logic for future versions
    // For now, just return the data
    console.warn(
      'StorageManager: Data migration needed',
      data._version,
      '->',
      this.version,
    );
    return data._data !== undefined ? data._data : data;
  }

  /**
   * Handles quota exceeded error by clearing old data
   * @private
   */
  _handleQuotaExceeded() {
    console.warn('StorageManager: Quota exceeded, clearing old data');

    try {
      const keys = this._getAllKeys();
      const items = keys.map((key) => ({
        key,
        data: JSON.parse(this.storage.getItem(key) || '{}'),
      }));

      // Sort by timestamp and remove oldest 25%
      items.sort((a, b) => (a.data._timestamp || 0) - (b.data._timestamp || 0));
      const toRemove = Math.ceil(items.length * 0.25);

      for (let i = 0; i < toRemove; i++) {
        this.storage.removeItem(items[i].key);
      }
    } catch (error) {
      console.error('StorageManager: Failed to handle quota exceeded', error);
    }
  }
}
