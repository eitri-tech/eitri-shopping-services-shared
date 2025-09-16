import StorageService from './StorageService'

export default class CookieService {
	static COOKIE_KEY = 'cookies'

	static setCookiesFromResponse = async (response: any) => {
		try {
			const rawCookieStr = response.headers['set-cookie']
			if (!rawCookieStr) return

			const stored = await CookieService.getAllCookies()

			// Divide por vírgula mas garante que não vai quebrar datas de expires
			const cookies = rawCookieStr.match(/[^,]+=[^;]+;[^,]*/g) || []
			cookies.forEach(cookieStr => {
				const [cookie] = cookieStr.split(';')
				const [key, value] = cookie.split('=')
				if (key && value) stored[key.trim()] = value.trim()
			})
			await StorageService.setStorageJSON(CookieService.COOKIE_KEY, stored)
		} catch (e) {
			console.error('Erro ao setar cookies', e)
		}
	}

	static getAllCookies = async (): Promise<Record<string, string>> => {
		try {
			return (await StorageService.getStorageJSON(CookieService.COOKIE_KEY)) ?? {}
		} catch {
			return {}
		}
	}

	static readonly getCookieHeader = async (): Promise<string> => {
		try {
			const cookies = await CookieService.getAllCookies()
			console.log('cookies', cookies)
			return Object.entries(cookies)
				.map(([k, v]) => `${k}=${v}`)
				.join('; ')
		} catch (e) {
			console.error('Erro ao obter cookies', e)
			return ''
		}
	}

	static clearAllCookies = async (): Promise<string> => {
		try {
			await StorageService.removeItem(CookieService.COOKIE_KEY)
		} catch (e) {
			return ''
		}
	}
}
