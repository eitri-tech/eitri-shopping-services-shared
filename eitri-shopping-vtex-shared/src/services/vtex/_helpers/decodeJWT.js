function base64UrlDecode(str) {
	// pad + replace
	str = str.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	return decodeURIComponent(escape(atob(str))); // atob -> binary -> utf8
}

export default function decodeJwt(token) {
	try {
		const [h, p /*, s*/] = token.split('.');
		return {
			...JSON.parse(base64UrlDecode(p))
		};
	} catch (e) {
		return null
	}
}