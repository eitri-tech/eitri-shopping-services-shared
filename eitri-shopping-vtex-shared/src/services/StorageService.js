import Eitri from 'eitri-bifrost'
import Logger from './Logger'
import Vtex from "./Vtex";

export default class StorageService {
	static async setStorageItem(key, item) {
    const account = Vtex.configs.account
    const _key = `${account}_${key}`
		return Eitri.sharedStorage.setItem(_key, item)
	}

	static async getStorageItem(key) {
    const account = Vtex.configs.account
    const _key = `${account}_${key}`
		return Eitri.sharedStorage.getItem(_key)
	}

	static async setStorageJSON(key, item) {
		try {
      const account = Vtex.configs.account
      const _key = `${account}_${key}`
			Logger.info('StorageService', 'setStorageJSON', 'Setting storage item', { key: _key, item })
			return Eitri.sharedStorage.setItem(_key, JSON.stringify(item))
		} catch (e) {
			console.error('Erro ao salvar item no storage', e)
		}
	}

	static async getStorageJSON(key) {
    const account = Vtex.configs.account
    const _key = `${account}_${key}`
		const data = await Eitri.sharedStorage.getItem(_key)
		Logger.info('StorageService', 'getStorageJSON', 'Getting storage item', _key, data)
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
    const account = Vtex.configs.account
    const _key = `${account}_${key}`
		return await Eitri.sharedStorage.removeItem(_key)
	}
}
