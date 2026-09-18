export default function extractCookies(response, cookieName) {
	if (!response?.headers || !cookieName) {
		return null
	}

	const raw = response.headers['set-cookie'] ?? response.headers['Set-Cookie']
	if (!raw) {
		return null
	}

	const header = Array.isArray(raw) ? raw.join(';') : String(raw)
	const regex = new RegExp(`(?:^|[;,]\\s*)${cookieName}=([^;]*)`, 'i')
	const match = header.match(regex)

	return match?.[1] || null
}
