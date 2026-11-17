import Eitri from 'eitri-bifrost'
import RemoteConfig from './RemoteConfig'
import StorageService from './StorageService'
import { sendDatadogWarningLog } from './Datadog'

const AWIN_URL = 'https://www.awin1.com/sread.php'

// a Awin reconhece a venda pelo click id (awc) do link de afiliado, guardado aqui junto do session_id da abertura corrente do app, então o clique vale só nessa sessão e uma compra sem clique salvo não é atribuída à Awin
export default class AwinService {
	static STORAGE_AWC_KEY = 'awin_awc'

	static isEnabled() {
		return RemoteConfig.getContent('awin.enabled') === true
	}

	static async saveClickId(awc) {
		if (!awc || !AwinService.isEnabled()) return

		try {
			const sessionId = await StorageService.getStorageItem('session_id')
			const click = { awc, sessionId: sessionId || null }
			await StorageService.setStorageJSON(AwinService.STORAGE_AWC_KEY, click)
		} catch (e) {
			console.error('Erro ao salvar o click id da Awin', e)
			sendDatadogWarningLog({ message: 'Erro ao salvar o click id da Awin' }, 'saveClickId')
		}
	}

	static async getSessionClick() {
		try {
			const saved = await StorageService.getStorageJSON(AwinService.STORAGE_AWC_KEY)
			if (!saved?.awc) return null

			const sessionId = await StorageService.getStorageItem('session_id')

			// num cold start pelo deeplink o clique pode ser gravado antes de o app principal criar o session_id, então a primeira leitura adota a sessão corrente em vez de jogar o clique fora
			if (!saved.sessionId) {
				await StorageService.setStorageJSON(AwinService.STORAGE_AWC_KEY, { ...saved, sessionId })
				return saved
			}

			if (saved.sessionId !== sessionId) {
				await StorageService.removeItem(AwinService.STORAGE_AWC_KEY)
				return null
			}

			return saved
		} catch (e) {
			console.error('Erro ao obter o click id da Awin', e)
			sendDatadogWarningLog({ message: 'Erro ao obter o click id da Awin' }, 'getSessionClick')
			return null
		}
	}

	static getPaymentMethodName(cart) {
		const paymentSystem = cart?.paymentData?.payments?.[0]?.paymentSystem
		return cart?.paymentData?.paymentSystems?.find(system => system.stringId === paymentSystem)?.name || ''
	}

	static async sendConversion(cart, orderId) {
		try {
			if (!orderId || !AwinService.isEnabled()) return

			const merchantId = RemoteConfig.getContent('awin.merchantId')
			if (!merchantId) return

			const click = await AwinService.getSessionClick()
			if (!click) return

			const params = {
				tt: 'ss',
				tv: '2',
				merchant: merchantId,
				amount: ((cart?.value || 0) / 100).toFixed(2),
				ch: 'aw', // canal padrão da Awin; o clique não carrega nada de UTM
				parts: '', // grupo de comissão: sem uso por enquanto
				vc: cart?.marketingData?.coupon || '',
				cr: RemoteConfig.getContent('storePreferences.currencyCode') || 'BRL',
				// orderId aqui é o orderGroup da VTEX (o pedido), não o pacote
				ref: orderId,
				cks: click.awc,
				p1: AwinService.getPaymentMethodName(cart)
			}

			const query = Object.entries(params)
				.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
				.join('&')

			await Eitri.http.get(`${AWIN_URL}?${query}`)
		} catch (e) {
			console.error('Erro ao registrar a conversão na Awin', e)
			sendDatadogWarningLog({ message: 'Erro ao registrar a conversão na Awin', orderId }, 'sendConversion')
		}
	}
}
