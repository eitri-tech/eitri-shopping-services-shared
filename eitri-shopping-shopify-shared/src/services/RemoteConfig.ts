import Eitri from 'eitri-bifrost'

export default class RemoteConfig {
	static content = null

	static _mergeOverwrites = (obj1: any, obj2: any) => {
		const result = { ...obj1 }
		for (const key in obj2) {
			if (obj2[key] instanceof Object && key in obj1 && obj1[key] instanceof Object) {
				result[key] = RemoteConfig._mergeOverwrites(obj1[key], obj2[key])
			} else {
				result[key] = obj2[key]
			}
		}
		return result
	}

	static async init(overwrites: any) {
		const remoteConfig = await Eitri.environment.getRemoteConfigs()
		RemoteConfig.content = overwrites ? RemoteConfig._mergeOverwrites(remoteConfig, overwrites) : remoteConfig
	}

	static getRemoteConfig() {
		return RemoteConfig.content
	}

	static getContent(key: string) {
		if (!RemoteConfig.content) {
			return null
		}
		return (
			key.split('.').reduce((obj: any, k) => {
				return obj?.[k]
			}, RemoteConfig.content) ?? null
		)
	}
}
