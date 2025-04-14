export default function extractCookies(response, cookieName) {
	// Return null if no response, headers, or cookie name
	if (!response || !response.headers || !cookieName) {
		return null
	}

	// Get the set-cookie header
	const setCookieHeader = response.headers['set-cookie']

	// Return null if no set-cookie header
	if (!setCookieHeader) {
		return null
	}

	// Split the cookies (they're separated by commas followed by a space and cookie name)
	const cookiesArray = setCookieHeader.split(/,\s(?=[^=]+=[^=]+)/)

	// Find the cookie that starts with the requested name
	for (const cookieStr of cookiesArray) {
		// Get the name=value part (first part before semicolon)
		const nameValuePart = cookieStr.split(';')[0].trim()

		// Split by first equals sign to separate name and value
		const separatorIndex = nameValuePart.indexOf('=')
		if (separatorIndex === -1) continue

		const name = nameValuePart.substring(0, separatorIndex)

		// Check if this is the cookie we're looking for
		if (name === cookieName) {
			// Return everything after the first equals sign (handles values with = in them)
			return nameValuePart.substring(separatorIndex + 1) || ''
		}
	}

	// Cookie not found
	return null
}
