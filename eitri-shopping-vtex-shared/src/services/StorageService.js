import Eitri from 'eitri-bifrost'
import Logger from './Logger'

export default class StorageService {
	static async setStorageItem(key, item) {
		return Eitri.sharedStorage.setItem(key, item)
	}

	static async getStorageItem(key) {
		return Eitri.sharedStorage.getItem(key)
	}

	static async setStorageJSON(key, item) {
		try {
			Logger.info('StorageService', 'setStorageJSON', 'Setting storage item', { key, item })
			return Eitri.sharedStorage.setItem(key, JSON.stringify(item))
		} catch (e) {
			console.error('Erro ao salvar item no storage', e)
		}
	}

	static async getStorageJSON(key) {
		const data = await Eitri.sharedStorage.getItem(key)
		Logger.info('StorageService', 'getStorageJSON', 'Getting storage item', key, data)
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
		return await Eitri.sharedStorage.removeItem(key)
	}
}
