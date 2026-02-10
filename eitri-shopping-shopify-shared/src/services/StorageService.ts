import Eitri from 'eitri-bifrost'
import Shopify from './Shopify'
import RemoteConfig from './RemoteConfig'

export default class StorageService {
	static async setStorageItem(key: string, item: string) {
		const host = RemoteConfig.getContent('providerInfo.host')
		const _key = `${host}_${key}`
		console.log('key', `${host}_${key}`)
		return Eitri.sharedStorage.setItem(_key, item)
	}

	static async getStorageItem(key: string) {
		const host = RemoteConfig.getContent('providerInfo.host')

		const _key = `${host}_${key}`
		return Eitri.sharedStorage.getItem(_key)
	}

	static async setStorageJSON(key: string, item: any) {
		try {
			const host = RemoteConfig.getContent('providerInfo.host')

			const _key = `${host}_${key}`

			return Eitri.sharedStorage.setItem(_key, JSON.stringify(item))
		} catch (e) {
			console.error('Erro ao salvar item no storage', e)
		}
	}

	static async getStorageJSON(key) {
		const host = RemoteConfig.getContent('providerInfo.host')

		const _key = `${host}_${key}`
		const data = await Eitri.sharedStorage.getItem(_key)

		if (data) {
			try {
				return JSON.parse(data)
			} catch (e) {
				console.log('Erro ao fazer parse do JSON')
				return null
			}
		} else {
			return null
		}
	}

	static async removeItem(key) {
		const host = RemoteConfig.getContent('providerInfo.host')

		const _key = `${host}_${key}`
		return await Eitri.sharedStorage.removeItem(_key)
	}
}
