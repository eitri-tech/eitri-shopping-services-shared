export default function objectToQueryString(obj) {
	if (!obj || typeof obj !== 'object') return ''
	const queryString = Object.keys(obj)
		.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
		.join('&')
	return queryString
}
