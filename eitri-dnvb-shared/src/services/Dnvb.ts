import Eitri from 'eitri-bifrost'
import type { DnvbConfig, DnvbConfigInput } from '../models/Config'
import { getConfig, setConfig } from './_helpers/config'
import { isObject } from './_helpers/http'
import CmsService from './cms/CmsService'
import JourneysService from './journeys/JourneysService'

export default class Dnvb {
	static cms = CmsService
	static journeys = JourneysService

	/**
	 * Lê `dnvb` do Remote Config (`cmsUrl`, `nexusUrl`, `applicationId`) e aplica os overwrites por cima.
	 * Opcional: sem ele valem as URLs de produção e o `applicationId` do Eitri-app. Cada Eitri-app roda
	 * numa WebView com a própria instância do SDK, então chame em todos com os mesmos overwrites.
	 */
	static async configure(overwrites?: DnvbConfigInput): Promise<DnvbConfig> {
		try {
			const remote = await Eitri.environment.getRemoteConfigs()
			if (isObject(remote) && isObject(remote.dnvb)) setConfig(remote.dnvb)
		} catch (e) {
			console.warn('[dnvb] Remote Config indisponível, usando a configuração padrão', e)
		}
		return setConfig(overwrites)
	}

	static getConfig(): DnvbConfig {
		return { ...getConfig() }
	}
}
