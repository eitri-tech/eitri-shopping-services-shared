import { App } from 'eitri-shopping-vtex-shared'
import { SalesUserService } from './SalesUserService'
import { SalesVendorService } from './SalesVendorService'
import SalesCartService from './SalesCartService'
import { SalesPerformanceService } from './SalesPerformanceService'
import { RemoteConfig } from '../models/SalesCart'

export interface SalesConfigs {
	account: string
	baseUrl: string
}

export default class Sales {
	static configs: SalesConfigs = {
		account: '',
		baseUrl: ''
	}

	static configure = async (remoteConfig: RemoteConfig): Promise<SalesConfigs> => {
		const { account, vtexCmsUrl } = remoteConfig?.providerInfo ?? {}

		if (!account || !vtexCmsUrl) {
			throw new Error(
				'[SALES] Invalid remote config: providerInfo.account and providerInfo.vtexCmsUrl are required'
			)
		}

		Sales.configs = {
			account,
			baseUrl: vtexCmsUrl.replace(/\/$/, '')
		}

		return Sales.configs
	}

	static tryAutoConfigure = async (): Promise<SalesConfigs> => {
		try {
			// Os fluxos do SDK (login, sessão, carrinho) usam Vtex.customer/VtexCaller,
			// que exigem o vtex-shared configurado. App.tryAutoConfigure é idempotente
			// e retorna o remote config completo, incluindo providerInfo.
			const remoteConfig = (await App.tryAutoConfigure()) as RemoteConfig
			return await Sales.configure(remoteConfig)
		} catch (error) {
			console.error('[SALES] Failed to auto-configure Sales service', error)
			throw error
		}
	}

	static getConfig = async (): Promise<SalesConfigs> => {
		if (!Sales.configs.account || !Sales.configs.baseUrl) {
			await Sales.tryAutoConfigure()
		}
		return Sales.configs
	}

	static user = SalesUserService
	static vendor = SalesVendorService
	static cart = SalesCartService
	static performance = SalesPerformanceService
}
