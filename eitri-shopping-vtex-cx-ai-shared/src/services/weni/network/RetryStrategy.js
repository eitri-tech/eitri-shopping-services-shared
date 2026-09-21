/**
 * RetryStrategy
 *
 * Implements exponential backoff with jitter for connection retries:
 * - Exponential delay increase (1s, 2s, 4s, 8s, 16s, 30s max)
 * - Random jitter to prevent thundering herd
 * - Configurable base delay, max delay, and multiplier
 * - Reset after successful connection
 *
 * Based on AWS best practices:
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
export default class RetryStrategy {
  constructor(config = {}) {
    this.config = {
      baseDelay: config.baseDelay || 1000, // Initial delay: 1s
      maxDelay: config.maxDelay || 30000, // Max delay: 30s
      factor: config.factor || 2, // Exponential factor
      jitter: config.jitter !== false, // Add random jitter
      maxJitter: config.maxJitter || 1000, // Max jitter: 1s
      ...config,
    };

    this.attempts = 0;
  }

  /**
   * Gets delay for next retry attempt
   * @param {number} attempt Optional attempt number (uses internal if not provided)
   * @returns {number} Delay in milliseconds
   */
  getDelay(attempt = null) {
    const attemptNumber = attempt !== null ? attempt : this.attempts;

    // Calculate exponential delay
    const exponentialDelay =
      this.config.baseDelay * Math.pow(this.config.factor, attemptNumber);

    // Cap at max delay
    let delay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      delay = this._addJitter(delay);
    }

    return Math.floor(delay);
  }

  /**
   * Gets delay and increments attempt counter
   * @returns {number} Delay in milliseconds
   */
  next() {
    const delay = this.getDelay();
    this.attempts++;
    return delay;
  }

  /**
   * Resets retry attempts counter
   */
  reset() {
    this.attempts = 0;
  }

  /**
   * Gets current attempt count
   * @returns {number}
   */
  getAttempts() {
    return this.attempts;
  }

  /**
   * Checks if should retry based on max attempts
   * @param {number} maxAttempts
   * @returns {boolean}
   */
  shouldRetry(maxAttempts) {
    return this.attempts < maxAttempts;
  }

  /**
   * Gets all delays up to max attempts
   * @param {number} maxAttempts
   * @returns {Array<number>}
   */
  getDelaySequence(maxAttempts) {
    const sequence = [];
    for (let i = 0; i < maxAttempts; i++) {
      sequence.push(this.getDelay(i));
    }
    return sequence;
  }

  /**
   * Adds random jitter to delay
   * @private
   * @param {number} delay
   * @returns {number}
   */
  _addJitter(delay) {
    // Full jitter: random value between 0 and delay
    // This spreads out retries across time
    const jitterAmount = Math.random() * Math.min(delay, this.config.maxJitter);
    return delay + jitterAmount;
  }
}
