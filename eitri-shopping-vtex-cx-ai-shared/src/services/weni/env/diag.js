/**
 * diag — tiny in-memory diagnostics buffer for the Weni chat.
 *
 * Eitri apps run in a WebView whose console.log is not reliably reachable from
 * the host (no `eitri start` console, no chromium CONSOLE in logcat). So we keep
 * a ring buffer of diagnostic lines that the UI can render on-screen, letting us
 * debug connection issues from a screenshot. Also mirrors to console.log.
 */
const MAX_LINES = 60

export function diagLog(...parts) {
	const line = parts
		.map(p => (typeof p === 'string' ? p : safeStringify(p)))
		.join(' ')
	const buf = (globalThis.__weniDiag ||= [])
	buf.push(line)
	if (buf.length > MAX_LINES) buf.splice(0, buf.length - MAX_LINES)
	try {
		console.log('[WeniChat]', line)
	} catch (_) {
		/* noop */
	}
}

export function getDiag() {
	return globalThis.__weniDiag ? globalThis.__weniDiag.slice() : []
}

export function clearDiag() {
	globalThis.__weniDiag = []
}

function safeStringify(value) {
	try {
		return JSON.stringify(value)
	} catch (_) {
		return String(value)
	}
}
