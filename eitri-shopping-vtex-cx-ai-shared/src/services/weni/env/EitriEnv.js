/**
 * EitriEnv
 *
 * Environment adapters that let the vendored Weni webchat library run inside an
 * Eitri Android WebView with the *same logic* it uses on the web. The library
 * is kept verbatim except for `StorageManager`, which resolves its backing
 * store through `getWebStorage()` here.
 *
 * Why: the library's `SessionManager`/`StorageManager` use the synchronous Web
 * Storage API (`localStorage`). Eitri's durable storage (`Eitri.sharedStorage`)
 * is async and would force an invasive sync→async refactor across the whole
 * library. Instead we keep a synchronous in-memory store (or the WebView's
 * `localStorage` when present) as the live backing store, and mirror it to
 * `Eitri.sharedStorage` for durability via `hydrate()` / `persist()`.
 */
import Eitri from 'eitri-bifrost'

/**
 * Key under which the whole `weni:aichat:*` snapshot is mirrored, scoped by
 * surface (e.g. 'home', 'account') — each surface gets its own mirror slot.
 * @param {string} [scope]
 * @returns {string}
 */
function mirrorKey(scope) {
	return `weni:aichat:mirror:${scope || 'default'}`
}

/**
 * Synchronous, Web-Storage-API-compatible in-memory store.
 * Implements the surface StorageManager relies on: getItem, setItem,
 * removeItem, key(i), length.
 */
class MemoryStorage {
	constructor() {
		this._map = new Map()
	}

	get length() {
		return this._map.size
	}

	key(index) {
		return Array.from(this._map.keys())[index] ?? null
	}

	getItem(key) {
		return this._map.has(key) ? this._map.get(key) : null
	}

	setItem(key, value) {
		this._map.set(key, String(value))
	}

	removeItem(key) {
		this._map.delete(key)
	}

	clear() {
		this._map.clear()
	}
}

/**
 * Detects whether the WebView exposes a usable synchronous `localStorage`.
 * @returns {boolean}
 */
function isLocalStorageUsable() {
	try {
		if (typeof localStorage === 'undefined' || !localStorage) return false
		const probe = '__weni_probe__'
		localStorage.setItem(probe, '1')
		localStorage.removeItem(probe)
		return true
	} catch (_) {
		return false
	}
}

// Singletons so ChatService's hydrate/persist operate on the very same store
// instance that StorageManager reads/writes.
let _localStore = null
let _sessionStore = null

/**
 * Resolves the synchronous backing store for the given StorageManager type.
 * Prefers the WebView's native Storage; falls back to an in-memory store.
 * @param {'local'|'session'} type
 * @returns {Storage|MemoryStorage}
 */
export function getWebStorage(type = 'local') {
	if (type === 'session') {
		if (_sessionStore) return _sessionStore
		try {
			if (typeof sessionStorage !== 'undefined' && sessionStorage) {
				_sessionStore = sessionStorage
				return _sessionStore
			}
		} catch (_) {
			/* fall through */
		}
		_sessionStore = new MemoryStorage()
		return _sessionStore
	}

	if (_localStore) return _localStore
	_localStore = isLocalStorageUsable() ? localStorage : new MemoryStorage()
	return _localStore
}

/**
 * Whether the live backing store is the in-memory fallback (i.e. the WebView
 * has no usable localStorage). When true, durability depends entirely on the
 * Eitri.sharedStorage mirror.
 * @returns {boolean}
 */
export function isUsingMemoryStore() {
	return getWebStorage('local') instanceof MemoryStorage
}

/**
 * Loads the persisted `weni:aichat:*` snapshot from Eitri.sharedStorage into
 * the live backing store. Call once before constructing the service.
 * @param {string} [scope]
 * @returns {Promise<void>}
 */
export async function hydrate(scope) {
	try {
		const snapshot = await Eitri.sharedStorage.getItemJson(mirrorKey(scope))
		if (!snapshot || typeof snapshot !== 'object') return
		const store = getWebStorage('local')
		Object.keys(snapshot).forEach(key => {
			try {
				store.setItem(key, snapshot[key])
			} catch (_) {
				/* ignore individual key failures */
			}
		})
	} catch (error) {
		console.log('[weni] hydrate from sharedStorage failed', error)
	}
}

/**
 * Mirrors the current `weni:aichat:*` keys from the live backing store back to
 * Eitri.sharedStorage. Safe to call often (callers should debounce).
 * @param {string} [scope]
 * @returns {Promise<void>}
 */
export async function persist(scope) {
	try {
		const key = mirrorKey(scope)
		const store = getWebStorage('local')
		const snapshot = {}
		for (let i = 0; i < store.length; i++) {
			const storeKey = store.key(i)
			if (storeKey && storeKey.startsWith('weni:aichat:') && storeKey !== key) {
				snapshot[storeKey] = store.getItem(storeKey)
			}
		}
		await Eitri.sharedStorage.setItemJson(key, snapshot)
	} catch (error) {
		console.log('[weni] persist to sharedStorage failed', error)
	}
}

/**
 * Clears the persisted mirror (used when the session is cleared).
 * @param {string} [scope]
 * @returns {Promise<void>}
 */
export async function clearMirror(scope) {
	try {
		await Eitri.sharedStorage.setItemJson(mirrorKey(scope), {})
	} catch (error) {
		console.log('[weni] clearMirror failed', error)
	}
}

/**
 * Reads the persisted session id from the backing store, unwrapping the
 * StorageManager envelope ({ _version, _timestamp, _data }).
 * @returns {string|null}
 */
export function getStoredSessionId() {
	try {
		const raw = getWebStorage('local').getItem('weni:aichat:session')
		if (!raw) return null
		const parsed = JSON.parse(raw)
		const session = parsed && parsed._data !== undefined ? parsed._data : parsed
		return session && session.id ? session.id : null
	} catch (_) {
		return null
	}
}

/**
 * Wipes all `weni:aichat:*` keys from the backing store and the durable mirror.
 * Used when the logged-in user changes so one user never sees another's history.
 * @param {string} [scope]
 * @returns {Promise<void>}
 */
export async function clearLocalSession(scope) {
	try {
		const store = getWebStorage('local')
		const keys = []
		for (let i = 0; i < store.length; i++) {
			const key = store.key(i)
			if (key && key.startsWith('weni:aichat:')) keys.push(key)
		}
		keys.forEach(key => store.removeItem(key))
	} catch (error) {
		console.log('[weni] clearLocalSession (store) failed', error)
	}
	await clearMirror(scope)
}
