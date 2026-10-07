import StorageService from '../../StorageService'

const STORAGE_USER_TOKEN_KEY = 'user_token_key'
const TOKEN_EXPIRATION_TIME_SEC = 86200

export async function getCustomerToken() {
	const savedToken = await StorageService.getStorageJSON(STORAGE_USER_TOKEN_KEY)

	if (!savedToken) {
		return null
	}

	if (
		savedToken.creationTimeStamp + TOKEN_EXPIRATION_TIME_SEC <
		Math.floor(Date.now() / 1000)
	) {
		return null
	}
	return savedToken
}

export async function getSessionToken() {
	return await StorageService.getStorageJSON('sessionToken')
}
