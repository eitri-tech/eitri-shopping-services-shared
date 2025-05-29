export default function extractCookies(response, cookieName) {
	// Return null if no response, headers, or cookie name
	if (!response || !response.headers || !cookieName) {
		return null
	}

	const regex = new RegExp(`${cookieName}=(.*?);`, 'i')
	const test = response?.headers['set-cookie']?.match(regex)

	if (test && test[1]) {
		return test[1]
	} else {
		return null
	}
}
