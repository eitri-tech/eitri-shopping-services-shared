import VtexCaller from '../_helpers/_vtexCaller'
import StorageService from './../../StorageService'
import { sendLogError } from '@/services/Datadog'

type Session = {
	sessionToken: string
	segmentToken: string
}

export default class VtexSessionService {
	static async createSession(payload: any = {}): Promise<Session> {
		try {
			const response = await VtexCaller.post(`api/sessions`, payload)
			await StorageService.setStorageJSON('sessionToken', response.data)
			return response.data
		} catch (e) {
			sendLogError(e, 'createSession')
			throw e
		}
	}

	static async getSession(items: string = '*'): Promise<any> {
		try {
			const response = await VtexCaller.get(`api/sessions?items=${items}`)
			return response.data
		} catch (e) {
			sendLogError(e, 'getSession', { items: items ?? null })
			throw e
		}
	}

	static async updateSession(payload?: any): Promise<Session> {
		try {
			const response = await VtexCaller.patch(`api/sessions`, payload ?? {})
			await StorageService.setStorageJSON('sessionToken', response.data)
			return response.data
		} catch (e) {
			sendLogError(e, 'updateSession')
			throw e
		}
	}

	static async getSegments(): Promise<any> {
		try {
			const response = await VtexCaller.get(`api/segments`)
			return response.data
		} catch (e) {
			sendLogError(e, 'getSegments')
			throw e
		}
	}

	static async getSessionToken(): Promise<Session> {
		return await StorageService.getStorageJSON('sessionToken')
	}

	static async removeSession(): Promise<void> {
		await StorageService.removeItem('sessionToken')
	}
}
