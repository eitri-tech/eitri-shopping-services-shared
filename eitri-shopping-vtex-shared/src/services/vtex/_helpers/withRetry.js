const sleep = ms => new Promise(r => setTimeout(r, ms))

export default async function withRetry(
	fn,
	{ retries = 3, delay = 500, onError = () => {}, shouldRetry = () => true, onFinalError = () => true } = {}
) {
	let attempt = 0

	while (attempt < retries) {
		try {
			attempt++
			return await fn(attempt)
		} catch (e) {
			onError(e, attempt)

			if (attempt >= retries || !shouldRetry(e)) {
				onFinalError(e, attempt)
				throw e
			}

			await sleep(delay)
		}
	}
}
