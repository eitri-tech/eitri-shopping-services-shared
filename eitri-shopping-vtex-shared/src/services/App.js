import Eitri from 'eitri-bifrost'
import Vtex from './Vtex'
import EventBus from '@/services/EventBus'
import EventBusChannels from './EventBusChannels'
import RemoteConfig from './RemoteConfig'
import StorageService from './StorageService'
import Logger from './Logger'
import GAService from './tracking/GAService'
import GAVtexInternalService from './tracking/GAVtexInternalService'
import vtexConfig from './vtex/vtexConfig'

let loaded = false

export default class App {
	static configs = {
		verbose: false,
		gaVerbose: false
	}

	static tryAutoConfigure = async overwrites => {
		if (loaded) return App.configs

		try {
			console.log('Inicializando eventBus', EventBusChannels.UTM_PARAMS)
			EventBus.subscribe({
				channel: EventBusChannels.UTM_PARAMS,
				broadcast: true,
				callback: segments => {
					console.log('Executando eventBus', EventBusChannels.UTM_PARAMS)
					Vtex.updateSegmentSession(segments)
				}
			})
		} catch (e) {
			console.error('Erro ao configurar eventBus', e)
		}

		const remoteConfig = await RemoteConfig.init(overwrites)

		await App.persistDeviceAndSession()

		try {
			console.log('[SHARED] ********* Config Vtex encontrada, configurando automaticamente *******')
			console.log('[SHARED] Account ======>', remoteConfig.providerInfo.account)
			console.log('[SHARED] Host ======>', remoteConfig.providerInfo.host)
			await Vtex.configure(remoteConfig)
		} catch (error) {
			console.error('[SHARED] Error autoConfigure ', error)
			throw error
		}

		App.setStatusBarColor(RemoteConfig.getContent('appConfigs.statusBarTextColor'))
		App.startClarity(RemoteConfig.getContent('appConfigs.clarityId'))
		App.setAppName(RemoteConfig.getContent('appConfigs.appName'))
		App.clearSale(RemoteConfig.getContent('appConfigs.checkout.clearSaleAppKey'))

		try {
			App.configs = {
				...App.configs,
				...remoteConfig
			}

			Logger.verbose = !!App.configs.verbose
			GAService.gaVerbose = !!App.configs.gaVerbose
			GAVtexInternalService.autoTriggerGAEvents = App.configs.appConfigs?.autoTriggerGAEvents ?? true

			if (!App.configs?.storePreferences?.currencyCode) {
				App.configs = {
					...App.configs,
					storePreferences: {
						...App.configs.storePreferences,
						currencyCode: 'BRL'
					}
				}
			}

			vtexConfig.currencyCode = App.configs?.storePreferences?.currencyCode || 'BRL'

			console.log('[SHARED] *********** App configurado com sucesso ************')

			loaded = true
			return App.configs
		} catch (error) {
			console.error('[SHARED] Error App configure ', error)
			throw error
		}
	}

	static setStatusBarColor(color) {
		if (color) {
			const _color = color === 'white' ? 'setStatusBarTextWhite' : 'setStatusBarTextBlack'
			window.EITRI.connector.invokeMethod(_color)
		}
	}

	static startClarity(clarityId) {
		try {
			if (clarityId) {
				Eitri.tracking.clarity.init(clarityId)
			}
		} catch (error) {
			console.error('[SHARED] Error ao inicializar Clarity', error)
		}
	}

	static setAppName(appName) {
		try {
			if (!appName) return
			window.__eitriAppConf.application = appName
		} catch (error) {
			console.error('[SHARED] Error ao setar nome do App', error)
		}
	}

	static deviceFingerprint = null

	static persistDeviceAndSession = async () => {
		try {
			const startParams = await Eitri.getInitializationInfos().catch(() => null)
			if (String(startParams?.tabIndex) !== '0') return

			let deviceId = await StorageService.getStorageItem('device_id')
			if (!deviceId) {
				deviceId = crypto.randomUUID()
				await StorageService.setStorageItem('device_id', deviceId)
			}

			const sessionId = crypto.randomUUID()
			await StorageService.setStorageItem('session_id', sessionId)

			console.log('[SHARED] Device/Session persisted', { deviceId, sessionId })
		} catch (error) {
			console.error('[SHARED] Error persisting device/session info', error)
		}
	}

	static clearSale(appKey) {
		try {
			if (!appKey) return

			const slug = window.__eitriAppConf?.slug || ''
			if (!slug.includes('checkout')) {
				return
			}

			console.log('[SHARED] ClearSale appKey', appKey)

			const sessionId = String(1e7 + Math.floor(99999999 * Math.random()))
			App.deviceFingerprint = sessionId
			vtexConfig.deviceFingerprint = sessionId

			window.CsdpObject = 'csdp'
			window.csdp = window.csdp || function () {
				;(window.csdp.q = window.csdp.q || []).push(arguments)
			}
			window.csdp.l = Date.now()

			const script = document.createElement('script')
			script.async = true
			script.src = 'https://device.clearsale.com.br/p/fp.js'
			document.head.appendChild(script)

			window.csdp('app', appKey)
			window.csdp('sessionid', sessionId)

			console.log('[SHARED] ClearSale inicializado com sessionId', sessionId)
		} catch (error) {
			console.error('[SHARED] Error ao inicializar ClearSale', error)
		}
	}
}
