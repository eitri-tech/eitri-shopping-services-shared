import VtexCaller from '../_helpers/_vtexCaller'
import StorageService from './../../StorageService'

type Session = {
	sessionToken: string
	segmentToken: string
}

export default class VtexSessionService {
	static async createSession(payload: any = {}): Promise<Session> {
		const response = await VtexCaller.post(`api/sessions`, payload)
		await StorageService.setStorageJSON('sessionToken', response.data)
		return response.data
	}

	static async getSession(items: string = '*'): Promise<any> {
		const response = await VtexCaller.get(`api/sessions?items=${items}`)
		return response.data
	}

	static async updateSession(payload?: any): Promise<Session> {
		const response = await VtexCaller.patch(`api/sessions`, payload ?? {})
		await StorageService.setStorageJSON('sessionToken', response.data)
		return response.data
	}

	static async getSegments(): Promise<any> {
		const response = await VtexCaller.get(`api/segments`)
		return response.data
	}

	static async getSessionToken(): Promise<Session> {
		return await StorageService.getStorageJSON('sessionToken')
	}
}
