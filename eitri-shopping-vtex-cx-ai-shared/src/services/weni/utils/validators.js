/**
 * Validation utility functions
 */

/**
 * Validates service configuration
 * @param {Object} config
 * @throws {Error}
 */
export function validateConfig(config) {
  if (!config) {
    throw new Error('Configuration is required');
  }

  if (!config.socketUrl || typeof config.socketUrl !== 'string') {
    throw new Error('socketUrl is required and must be a string');
  }

  if (!config.channelUuid || typeof config.channelUuid !== 'string') {
    throw new Error('channelUuid is required and must be a string');
  }

  if (
    config.connectOn &&
    !['mount', 'manual', 'demand'].includes(config.connectOn)
  ) {
    throw new Error('connectOn must be "mount", "manual" or "demand"');
  }

  if (config.storage && !['local', 'session'].includes(config.storage)) {
    throw new Error('storage must be "local" or "session"');
  }

  if (
    config.maxReconnectAttempts &&
    typeof config.maxReconnectAttempts !== 'number'
  ) {
    throw new Error('maxReconnectAttempts must be a number');
  }

  if (config.pingInterval && typeof config.pingInterval !== 'number') {
    throw new Error('pingInterval must be a number');
  }
}

/**
 * Validates message object
 * @param {Object} message
 * @returns {boolean}
 */
export function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (!message.type || typeof message.type !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validates URL
 * @param {string} url
 * @returns {boolean}
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates WebSocket URL
 * @param {string} url
 * @returns {boolean}
 */
export function validateWebSocketUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return url.startsWith('ws://') || url.startsWith('wss://');
}

/**
 * Validates UUID
 * @param {string} uuid
 * @returns {boolean}
 */
export function validateUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates email
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number (basic)
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitizes text input
 * @param {string} text
 * @returns {string}
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 5000); // Limit length
}

/**
 * Validates file type
 * @param {string} mimeType
 * @param {Array<string>} allowedTypes
 * @returns {boolean}
 */
export function validateFileType(mimeType, allowedTypes) {
  if (!mimeType || !Array.isArray(allowedTypes)) {
    return false;
  }

  return allowedTypes.includes(mimeType);
}

/**
 * Validates starters product data before sending a get_pdp_starters request.
 * @param {Object} productData
 * @throws {Error} If productData is falsy, or account/linkText are missing or empty.
 */
export function validateStartersData(productData) {
  if (!productData) {
    throw new Error('Product data is required');
  }

  if (!productData.account || typeof productData.account !== 'string') {
    throw new Error('account is required and must be a non-empty string');
  }

  if (!productData.linkText || typeof productData.linkText !== 'string') {
    throw new Error('linkText is required and must be a non-empty string');
  }
}

/**
 * Validates file size
 * @param {number} size
 * @param {number} maxSize
 * @returns {boolean}
 */
export function validateFileSize(size, maxSize) {
  if (typeof size !== 'number' || typeof maxSize !== 'number') {
    return false;
  }

  return size > 0 && size <= maxSize;
}
