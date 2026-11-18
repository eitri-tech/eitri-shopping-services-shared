import Eitri from 'eitri-bifrost'
import RemoteConfig from './RemoteConfig'
import StorageService from './StorageService'
import { sendDatadogWarningLog } from './Datadog'

const AWIN_URL = 'https://www.awin1.com/sread.php'

// a Awin reconhece a venda pelo click id (awc) do link de afiliado, guardado aqui junto do horário em que o clique chegou; ele conta para a compra só enquanto estiver dentro da validade em horas do remote config (awin.expirationTime), e uma compra sem clique válido não é atribuída à Awin
export default class AwinService {
	static STORAGE_AWC_KEY = 'awin_awc'
	static DEFAULT_EXPIRATION_HOURS = 6

	static isEnabled() {
		return RemoteConfig.getContent('awin.enabled') === true
	}

	// awin.expirationTime vem como string com o número de horas (ex.: "6"); valor ausente ou inválido cai no padrão
	static getExpirationHours() {
		const hours = Number(RemoteConfig.getContent('awin.expirationTime'))
		return Number.isFinite(hours) && hours > 0 ? hours : AwinService.DEFAULT_EXPIRATION_HOURS
	}

	// um clique novo sobrescreve o anterior e reinicia a contagem (último clique vence)
	static async saveClickId(awc) {
		if (!awc || !AwinService.isEnabled()) return

		try {
			const click = { awc, savedAt: Date.now() }
			await StorageService.setStorageJSON(AwinService.STORAGE_AWC_KEY, click)
		} catch (e) {
			console.error('Erro ao salvar o click id da Awin', e)
			sendDatadogWarningLog({ message: 'Erro ao salvar o click id da Awin' }, 'saveClickId')
		}
	}

	static async getActiveClick() {
		try {
			const saved = await StorageService.getStorageJSON(AwinService.STORAGE_AWC_KEY)
			if (!saved?.awc) return null

			const expirationMs = AwinService.getExpirationHours() * 60 * 60 * 1000
			const savedAt = Number(saved.savedAt)

			// clique gravado no formato antigo (sem savedAt) ou já fora da validade não conta mais
			if (!Number.isFinite(savedAt) || Date.now() - savedAt > expirationMs) {
				await StorageService.removeItem(AwinService.STORAGE_AWC_KEY)
				return null
			}

			return saved
		} catch (e) {
			console.error('Erro ao obter o click id da Awin', e)
			sendDatadogWarningLog({ message: 'Erro ao obter o click id da Awin' }, 'getActiveClick')
			return null
		}
	}

	// nome mantido por compatibilidade: os checkouts das lojas (ex.: intimissimi) chamam Awin.getSessionClick() para a tag de awc; a regra de validade é a mesma do getActiveClick
	static async getSessionClick() {
		return AwinService.getActiveClick()
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

			const click = await AwinService.getActiveClick()
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
