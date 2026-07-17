import Logger from '../../Logger'
import VtexCaller from '../_helpers/_vtexCaller'
import extractCookies from '../_helpers/extractCookies'
import Eitri from 'eitri-bifrost'
import App from '../../App'
import Vtex from '../../Vtex'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'
import { sendLogError, sendLogOrderAccepted, sendOrderNotComplete } from '../../Datadog'
import RemoteConfig from '../../RemoteConfig'

type PaymentOptions = {
	fields: {
		accountId: string
		holderName: string
		cardNumber: string
		validationCode: string
		dueDate: string
		bin: string
		address: {
			street: string
			complement: string
			number: string
			city: string
			reference: string
			neighborhood: string
			state: string
			country: string
			postalCode: string
		}
	}
	captchaToken: string
	captchaSiteKey: string
	savePersonalData: boolean
	optinNewsLetter: boolean
}

type StartTransactionReturn = {
	id: string
	orderGroup: string
	Vtex_CHKO_Auth: string
	CheckoutDataAccess: string
	merchantTransactions: {
		id: string;
		merchantName: string
		transactionId: string
		payments: {
			accountId?: string
			bin?: string
			giftCardId?: string
			giftCardProvider?: string
			giftCardRedemptionCode?: string
			paymentSystem: string
			value: number
			tokenId: number
			referenceValue: number
		}[]
	}[]
	payments: {
		accountId?: string
		bin?: string
		merchantSellerPayments: {
			id: string
			installmentValue: number
			installments: number
			interestRate: number
			referenceValue: number
			value: number
		}[]
		paymentSystem: number
		referenceValue: number
		tokenId?: string
		value: number
	}[]
}

type ProcessPaymentReturn = {
	orderId: string
	transactionId: string
	status: string
} & {
	[key: string]: any
}

export default class VtexPaymentService {
	static async executePayment(cart: any, options?: PaymentOptions) {
		try {
			const startTransactionReturn: StartTransactionReturn = await VtexPaymentService.startTransaction(
				cart,
				options
			)

			await VtexPaymentService.setPaymentMethod(cart, startTransactionReturn, options)

			const paymentProcessed: ProcessPaymentReturn =
				await VtexPaymentService.processPayment(startTransactionReturn)

			GAVtexInternalService.purchase(cart, paymentProcessed?.transactionId || paymentProcessed?.orderId)

			sendLogOrderAccepted(cart)

			return paymentProcessed
		} catch (e) {
			const NOT_COMPLETE_ERRORS = ['CHK0328', 'CHK003', 'CHK0087', 'ORD062', 'CHK0223']
			const errorCode = e.response?.data?.error?.code

			if (NOT_COMPLETE_ERRORS.includes(errorCode)) {
				sendOrderNotComplete(e, 'executePayment')
			} else {
				sendLogError(e, 'executePayment')
			}

			throw e
		}
	}

	static async startTransaction(cart: any, options?: PaymentOptions): Promise<StartTransactionReturn> {
		const valuePayments = cart?.paymentData?.payments?.reduce((acc, payment) => payment.value + acc, 0)
		const giftValuePayments = cart?.paymentData?.giftCards?.reduce((acc, giftCard) => giftCard.value + acc, 0)
		const value = valuePayments + giftValuePayments

		try {
			const payload = {
				referenceId: cart.orderFormId,
				savePersonalData: options?.savePersonalData ?? true,
				optinNewsLetter: options?.optinNewsLetter ?? false,
				value: value,
				referenceValue: cart.value,
				recaptchaKey: options?.captchaSiteKey,
				recaptchaToken: options?.captchaToken
			}

			Logger.log('====> Iniciando transação payload', payload)

			const result = await VtexCaller.post(
				`api/checkout/pub/orderForm/${cart.orderFormId}/transaction`,
				payload,
				{
					headers: {
						'accept': 'application/json, text/javascript, */*; q=0.01',
						'content-type': 'application/json'
					}
				}
			)

			const transactionData = result.data

			if (!transactionData.id) {
				throw Error(JSON.stringify(transactionData.messages))
			}

			const { id, orderGroup, merchantTransactions, paymentData } = transactionData

			const Vtex_CHKO_Auth = extractCookies(result, 'Vtex_CHKO_Auth')
			const CheckoutDataAccess = extractCookies(result, 'CheckoutDataAccess=VTEX_CHK_Order_Auth')

			const dataReturn = {
				id,
				orderGroup,
				Vtex_CHKO_Auth,
				CheckoutDataAccess,
				merchantTransactions,
				payments: paymentData.payments
			}

			console.log('====> Transaçao finalizada com sucesso com transactionId', id)
			Logger.log('====> Transaçao finalizada com sucesso', dataReturn)

			return dataReturn
		} catch (e) {
			console.log('Erro no startPayment', e)
			throw e
		}
	}

	static async setPaymentMethod(cart: any, startTransactionReturn: StartTransactionReturn, options?: PaymentOptions) {
		console.log('====> Setando o método de pagamento', startTransactionReturn.id)
		try {
			let paymentsMethods = []

			startTransactionReturn?.payments?.forEach(payment => {
				payment.merchantSellerPayments.map(msp => {
					const merchant = startTransactionReturn?.merchantTransactions?.find(mt => mt.id === msp.id)

					paymentsMethods.push({
						paymentSystem: payment?.paymentSystem,
						installments: msp?.installments,
						currencyCode: App.configs?.storePreferences?.currencyCode || 'BRL',
						installmentsInterestRate: msp?.interestRate ?? 0,
						value: msp?.value,
						installmentsValue: msp?.installmentValue,
						referenceValue: msp?.referenceValue,
						fields: options?.fields,
						transaction: {
							id: merchant?.transactionId,
							merchantName: merchant?.merchantName
						}
					})
				})
			})

			const giftCardPaymentSystem = cart?.paymentData?.paymentSystems?.find(
				system => system.groupName === 'giftCardPaymentGroup'
			)

			if (giftCardPaymentSystem) {
				cart?.paymentData?.giftCards?.forEach(giftCard => {
					if (!giftCard.inUse || giftCard.value === 0) {
						return
					}

					const giftCardId = giftCard.id
					const giftCardMerchant = startTransactionReturn?.merchantTransactions?.find(mt =>
						mt.payments?.some(p => p.giftCardId === giftCardId)
					)

					paymentsMethods.push({
						paymentSystem: giftCardPaymentSystem.id,
						installments: 1,
						installmentsValue: giftCard.value,
						value: giftCard.value,
						referenceValue: giftCard.value,
						fields: {
							redemptionCode: giftCard.redemptionCode,
							provider: giftCard.provider,
							giftCardId: giftCard.id
						},
						transaction: {
							id: giftCardMerchant?.transactionId,
							merchantName: giftCardMerchant?.merchantName
						}
					})
				})
			}

			Logger.log('====> Setando o método de pagamento com o payload', paymentsMethods)

			const useNewVtexVaultApi = RemoteConfig.getContent('appConfigs.checkout.useVaultApi')

			// Testar e tornar padrao https://developers.vtex.com/updates/release-notes/2025-10-28-mandatory-migration-to-vtexvault-com-for-send-payments-request
			const url = useNewVtexVaultApi
				? `https://api.vtexvault.com/api/payments/transactions/${startTransactionReturn.id}/payments?an=${Vtex.configs.account}&orderId=${startTransactionReturn.orderGroup}`
				: `https://${Vtex.configs.account}.vtexpayments.com.br/api/pub/transactions/${startTransactionReturn.id}/payments`

			await Eitri.http.post(url, paymentsMethods, {
				headers: {
					'accept': 'application/json, text/javascript, */*; q=0.01',
					'content-type': 'application/json'
				}
			})

			console.timeEnd('setPaymentMethod')
			console.log('====> Método de pagamento definido para o transactionId', startTransactionReturn.id)
		} catch (e) {
			console.log('erro no setPaymentMethod', e)
			throw e
		}
	}

	static async processPayment(startTransactionReturn: StartTransactionReturn): Promise<ProcessPaymentReturn> {
		console.log('====> Processando o pagamento', startTransactionReturn.orderGroup)

		try {
			await VtexCaller.post(`/api/checkout/pub/gatewayCallback/${startTransactionReturn.orderGroup}`, null, {
				headers: {
					'accept': 'application/json, text/javascript, */*; q=0.01',
					'content-type': 'application/json',
					'Cookie': `Vtex_CHKO_Auth=${startTransactionReturn.Vtex_CHKO_Auth};CheckoutDataAccess=VTEX_CHK_Order_Auth=${startTransactionReturn.CheckoutDataAccess}`
				}
			})

			console.log('=====> Pagamento processado com sucesso', startTransactionReturn.orderGroup)
			return {
				orderId: startTransactionReturn.orderGroup,
				transactionId: startTransactionReturn.id,
				status: 'completed'
			}
		} catch (e) {
			console.timeEnd('processPayment')

			if (e?.response?.status === 428) {
				console.log(
					'=====> Pagamento processado com sucesso status 428',
					startTransactionReturn.orderGroup,
					e.response.data
				)
				return {
					orderId: startTransactionReturn.orderGroup,
					transactionId: startTransactionReturn.id,
					status: 'waiting_payment',
					...e.response.data
				}
			} else {
				console.log('erro no processPayment', e)
				throw e
			}

		}
	}
}
