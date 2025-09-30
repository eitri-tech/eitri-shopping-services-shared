import StorageService from './StorageService'

type StoredCookie = {
	value: string
	expires?: string
}

export default class CookieService {
	static COOKIE_KEY = 'cookies'

	private static getStoredCookies = async (): Promise<Record<string, StoredCookie>> => {
		try {
			return (await StorageService.getStorageJSON(CookieService.COOKIE_KEY)) ?? {}
		} catch {
			return {}
		}
	}

	static setCookiesFromResponse = async (response: any) => {
		try {
			const rawCookieStr = response.headers['set-cookie']

			if (!rawCookieStr) return

			const stored = await this.getStoredCookies()

			// Divide por vírgula mas garante que não vai quebrar datas de expires
			const cookies = rawCookieStr.split(/,(?=[^ ;]+=)/) || []

			cookies.forEach((cookieStr: string) => {
				const parts = cookieStr.split(';').map(p => p.trim())
				const [cookieName, ...cookieValueParts] = parts[0].split('=')
				const cookieValue = cookieValueParts.join('=')

				if (cookieName && cookieValue) {
					const cookieData: StoredCookie = {
						value: cookieValue.trim()
					}

					parts.slice(1).forEach(part => {
						const [key, ...valueParts] = part.split('=')
						const value = valueParts.join('=').trim()
						const lowerKey = key.trim().toLowerCase()

						if (lowerKey === 'expires' && value) {
							cookieData.expires = new Date(value).toISOString()
						}

						if (lowerKey === 'max-age' && value) {
							const maxAge = parseInt(value, 10)
							if (!isNaN(maxAge)) {
								const expiryDate = new Date(Date.now() + maxAge * 1000)
								cookieData.expires = expiryDate.toISOString()
							}
						}
					})
					stored[cookieName.trim()] = cookieData
				}
			})
			console.log('Cookies setados', stored)
			await StorageService.setStorageJSON(CookieService.COOKIE_KEY, stored)
		} catch (e) {
			console.error('Erro ao setar cookies', e)
		}
	}

	static getAllCookies = async (): Promise<Record<string, string>> => {
		try {
			const storedCookies = await this.getStoredCookies()
			const now = new Date()
			const validCookies: Record<string, string> = {}

			for (const name in storedCookies) {
				const cookie = storedCookies[name]
				if (typeof cookie === 'string') {
					validCookies[name] = cookie
					continue
				}

				if (cookie.expires) {
					const expiresDate = new Date(cookie.expires)
					if (expiresDate > now) {
						validCookies[name] = cookie.value
					}
				} else {
					validCookies[name] = cookie.value
				}
			}
			return validCookies
		} catch {
			return {}
		}
	}

	static readonly getCookieHeader = async (): Promise<string> => {
		try {
			const cookies = await CookieService.getAllCookies()
			return Object.entries(cookies)
				.map(([k, v]) => `${k}=${v}`)
				.join('; ')
		} catch (e) {
			console.error('Erro ao obter cookies', e)
			return ''
		}
	}

	static clearAllCookies = async (): Promise<void> => {
		try {
			await StorageService.removeItem(CookieService.COOKIE_KEY)
		} catch (e) {
			console.error('Erro ao limpar cookies', e)
		}
	}

	static deleteCookie = async (name: string): Promise<void> => {
		if (!name) return
		try {
			const stored = await this.getStoredCookies()
			if (stored && Object.prototype.hasOwnProperty.call(stored, name)) {
				delete stored[name]
				await StorageService.setStorageJSON(CookieService.COOKIE_KEY, stored)
			}
		} catch (e) {
			console.error('Erro ao deletar cookie', name, e)
		}
	}

	static deleteAuthCookies = async (): Promise<void> => {
		try {
			const stored = await this.getStoredCookies()
			const names = Object.keys(stored).filter(
				n => n.startsWith('VtexIdclientAutCookie') || n.startsWith('Vtex_CHKO_Auth')
			)
			if (names.length === 0) return
			for (const name of names) {
				delete stored[name]
			}
			await StorageService.setStorageJSON(CookieService.COOKIE_KEY, stored)
		} catch (e) {
			console.error('Erro ao deletar cookies de autenticação VTEX', e)
		}
	}
}
