import VtexCaller from '../_helpers/_vtexCaller'
import StorageService from './../../StorageService'

type Session = {
	sessionToken: string
	segmentToken: string
}

export default class VtexSessionService {
	static SESSION_KEY = 'session'

	static async createSession(payload: any = {}): Promise<Session> {
		const response = await VtexCaller.post(`api/sessions`, payload)
		return response.data
	}

	static async getSession(items: string = '*'): Promise<any> {
		const response = await VtexCaller.get(`api/sessions?items=${items}`)
		return response.data
	}

	static async updateSession(payload?: any): Promise<Session> {
		const response = await VtexCaller.patch(`api/sessions`, payload)
		return response.data
	}

	static async getSegments(): Promise<any> {
		const response = await VtexCaller.patch(`api/segments`)
		return response.data
	}

	static async saveLocalSession(payload: any): Promise<any> {
		await StorageService.setStorageJSON(VtexSessionService.SESSION_KEY, payload)
	}

	static async getLocalSession(): Promise<any> {
		await StorageService.getStorageJSON(VtexSessionService.SESSION_KEY)
	}
}
