import Eitri from 'eitri-bifrost'
import Vtex from './Vtex'
import EventBus from '@/services/EventBus'
import RemoteConfig from './RemoteConfig'
import StorageService from './StorageService'

let loaded = false

export default class App {
	static configs = {
		verbose: false,
		gaVerbose: false
	}

	static tryAutoConfigure = async overwrites => {
		if (loaded) return App.configs

		try {
			console.log('Inicializando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
			EventBus.subscribe({
				channel: Vtex.customer.CHANNEL_UTM_PARAMS_KEY,
				broadcast: true,
				callback: segments => {
					console.log('Executando eventBus', Vtex.customer.CHANNEL_UTM_PARAMS_KEY)
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
		App.koinFingerprint(RemoteConfig.getContent('appConfigs.checkout.koinOrgId'))

		try {
			App.configs = {
				...App.configs,
				...remoteConfig
			}

			if (!App.configs?.storePreferences?.currencyCode) {
				App.configs = {
					...App.configs,
					storePreferences: {
						...App.configs.storePreferences,
						currencyCode: 'BRL'
					}
				}
			}

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

	static koinFingerprint(koinOrgId) {
		try {
			if (!koinOrgId) return

			const slug = window.__eitriAppConf?.slug || ''
			if (!slug.includes('checkout')) {
				return
			}

			console.log('[SHARED] Koin orgId', koinOrgId)

			const fingerprint = crypto.randomUUID().replace(/-/g, '')
			App.deviceFingerprint = fingerprint

			const iframe = document.createElement('iframe')
			iframe.src = `https://antifraud.koinlatam.com/risk/fingerprint/statics/track.html?org_id=${encodeURIComponent(koinOrgId)}&session_id=${fingerprint}`
			iframe.id = '__k_fingerprint_iframe__'
			iframe.title = 'Koin fingerprint'
			iframe.allow = 'payment'
			iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;'
			document.body.appendChild(iframe)

			console.log('[SHARED] Koin fingerprint inicializado', fingerprint)
		} catch (error) {
			console.error('[SHARED] Error ao inicializar Koin fingerprint', error)
		}
	}
}
