/**
 * EventEmitter
 *
 * Minimal, dependency-free EventEmitter compatible with the subset of the
 * `eventemitter3` API used by the Weni webchat library (on / once / off /
 * removeListener / removeAllListeners / emit / listeners).
 *
 * Vendored because Eitri apps cannot declare arbitrary npm dependencies — only
 * the framework's allow-listed ones. This keeps the rest of the ported library
 * verbatim.
 */
export default class EventEmitter {
  constructor() {
    this._events = Object.create(null);
  }

  /**
   * Registers a listener for an event.
   * @param {string} event
   * @param {Function} fn
   * @param {any} [context]
   * @returns {this}
   */
  on(event, fn, context) {
    return this._addListener(event, fn, context, false);
  }

  /**
   * Alias for on().
   */
  addListener(event, fn, context) {
    return this._addListener(event, fn, context, false);
  }

  /**
   * Registers a one-time listener for an event.
   * @param {string} event
   * @param {Function} fn
   * @param {any} [context]
   * @returns {this}
   */
  once(event, fn, context) {
    return this._addListener(event, fn, context, true);
  }

  _addListener(event, fn, context, once) {
    if (typeof fn !== 'function') {
      throw new TypeError('The listener must be a function');
    }
    const listener = { fn, context: context || this, once: !!once };
    (this._events[event] || (this._events[event] = [])).push(listener);
    return this;
  }

  /**
   * Removes a listener (or all listeners of an event when fn is omitted).
   * @param {string} event
   * @param {Function} [fn]
   * @param {any} [context]
   * @param {boolean} [once]
   * @returns {this}
   */
  removeListener(event, fn, context, once) {
    const listeners = this._events[event];
    if (!listeners) return this;

    if (!fn) {
      delete this._events[event];
      return this;
    }

    const remaining = listeners.filter((l) => {
      const fnMismatch = l.fn !== fn;
      const onceMismatch = once && !l.once;
      const contextMismatch = context && l.context !== context;
      return fnMismatch || onceMismatch || contextMismatch;
    });

    if (remaining.length) {
      this._events[event] = remaining;
    } else {
      delete this._events[event];
    }
    return this;
  }

  /**
   * Alias for removeListener().
   */
  off(event, fn, context, once) {
    return this.removeListener(event, fn, context, once);
  }

  /**
   * Removes all listeners for an event, or for every event when omitted.
   * @param {string} [event]
   * @returns {this}
   */
  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = Object.create(null);
    }
    return this;
  }

  /**
   * Returns the array of listener functions for an event.
   * @param {string} event
   * @returns {Function[]}
   */
  listeners(event) {
    const listeners = this._events[event];
    return listeners ? listeners.map((l) => l.fn) : [];
  }

  /**
   * Emits an event, invoking every registered listener synchronously.
   * @param {string} event
   * @param {...any} args
   * @returns {boolean} true if the event had listeners
   */
  emit(event, ...args) {
    const listeners = this._events[event];
    if (!listeners || !listeners.length) return false;

    // Copy to tolerate mutation (e.g. once removal) during iteration.
    const snapshot = listeners.slice();
    for (let i = 0; i < snapshot.length; i++) {
      const listener = snapshot[i];
      if (listener.once) {
        this.removeListener(event, listener.fn, listener.context, true);
      }
      listener.fn.apply(listener.context, args);
    }
    return true;
  }
}
