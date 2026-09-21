/**
 * Utility helper functions
 */

/**
 * Generates a unique UUID v4
 * @returns {string}
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a unique session ID in the format: timestamp@hostname
 * Same format as the original widget
 * @param {string} clientId - Optional client ID, defaults to window.location.hostname
 * @returns {string}
 */
export function generateSessionId(clientId = null) {
  let validClientId;

  if (
    clientId === null ||
    clientId === undefined ||
    clientId.trim === undefined ||
    clientId.trim() === ''
  ) {
    validClientId = window.location.hostname;
  } else {
    validClientId = clientId;
  }

  const randomId = Math.floor(Math.random() * Date.now());

  return `${randomId}@${validClientId}`;
}

/**
 * Generates a unique message ID
 * @returns {string}
 */
export function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats timestamp to readable string (for logging/debugging)
 * @param {number} timestamp
 * @param {string} locale
 * @returns {string}
 */
export function formatTimestamp(timestamp, locale = 'en-US', timeZone) {
  const date = new Date(timestamp);

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Formats file size to readable string (for logging/debugging)
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Debounces a function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clones an object
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  const isObject = obj instanceof Object;

  if (obj === null || !isObject) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  const clonedObj = {};
  for (const key in obj) {
    clonedObj[key] = deepClone(obj[key]);
  }
  return clonedObj;
}

/**
 * Checks if value is empty
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely parses JSON
 * @param {string} json
 * @param {any} defaultValue
 * @returns {any}
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Retries a promise function
 * @param {Function} fn
 * @param {number} retries
 * @param {number} delay
 * @returns {Promise}
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

/**
 * Creates a promise that times out
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise}
 */
export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms),
    ),
  ]);
}
