import Logger from '../../Logger'
import VtexCaller from '../_helpers/_vtexCaller'
import extractCookies from '../_helpers/extractCookies'
import Eitri from 'eitri-bifrost'
import App from '../../App'
import Vtex from '../../Vtex'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'

type PaymentOptions = {
	cardInfo: {
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
	interestValue: number
}

type StartTransactionReturn = {
	id: string
	orderGroup: string
	Vtex_CHKO_Auth: string
	CheckoutDataAccess: string
	merchantTransactionId: string
	merchantTransactionName: string
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
		const startTransactionReturn: StartTransactionReturn = await VtexPaymentService.startTransaction(cart, options)

		await VtexPaymentService.setPaymentMethod(cart, startTransactionReturn, options)

		const paymentProcessed: ProcessPaymentReturn = await VtexPaymentService.processPayment(startTransactionReturn)

		GAVtexInternalService.purchase(cart, paymentProcessed?.transactionId || paymentProcessed?.orderId)

		return paymentProcessed
	}

	static async startTransaction(cart: any, options?: PaymentOptions): Promise<StartTransactionReturn> {
		console.log('====> Iniciando transação', cart.orderFormId)

		try {
			const payload = {
				referenceId: cart.orderFormId,
				savePersonalData: options?.savePersonalData ?? true,
				optinNewsLetter: options?.optinNewsLetter ?? false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: options?.interestValue ?? 0
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

			const { id, orderGroup, merchantTransactions } = transactionData

			const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

			const Vtex_CHKO_Auth = extractCookies(result, 'Vtex_CHKO_Auth')
			const CheckoutDataAccess = extractCookies(result, 'CheckoutDataAccess=VTEX_CHK_Order_Auth')

			const dataReturn = {
				id,
				orderGroup,
				Vtex_CHKO_Auth,
				CheckoutDataAccess,
				merchantTransactionId: merchantTransaction?.id,
				merchantTransactionName: merchantTransaction?.merchantName
			}

			console.log('====> Transaçao finalizada com sucesso com transactionId', id)
			Logger.log('====> Transaçao finalizada com sucesso', dataReturn)

			return dataReturn
		} catch (e) {
			console.log('erro no startPayment', e)
		}
	}

	static async setPaymentMethod(cart: any, startTransactionReturn: StartTransactionReturn, options?: PaymentOptions) {
		console.log('====> Setando o método de pagamento', startTransactionReturn.id)
		try {
			let paymentsMethods = []

			cart?.paymentData?.payments?.forEach(payment => {
				paymentsMethods.push({
					paymentSystem: payment?.paymentSystem,
					installments: payment?.installments,
					currencyCode: App.configs?.storePreferences?.currencyCode || 'BRL',
					value: payment?.value,
					installmentsInterestRate: payment?.installmentsInterestRate ?? 0,
					installmentsValue: payment?.installmentsValue ?? '',
					referenceValue: payment?.referenceValue,
					fields: options?.cardInfo,
					transaction: {
						id: startTransactionReturn.id,
						merchantName: startTransactionReturn.merchantTransactionName
					}
				})
			})

			const giftCardPaymentSystem = cart?.paymentData?.paymentSystems?.find(
				system => system.groupName === 'giftCardPaymentGroup'
			)

			if (giftCardPaymentSystem) {
				cart?.paymentData?.giftCards?.forEach(giftCard => {
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
							id: startTransactionReturn.id,
							merchantName: startTransactionReturn.merchantTransactionName
						}
					})
				})
			}

			Logger.log('====> Setando o método de pagamento com o payload', paymentsMethods)

			await Eitri.http.post(
				`https://${Vtex.configs.account}.vtexpayments.com.br/api/pub/transactions/${startTransactionReturn.id}/payments`,
				paymentsMethods,
				{
					headers: {
						'accept': 'application/json, text/javascript, */*; q=0.01',
						'content-type': 'application/json',
						'user-agent':
							'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
					}
				}
			)

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
					'user-agent':
						'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
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
			if (!e.response.data) {
				console.log('erro no processPayment no content', e.response)
				throw Error(e)
			}

			if (e.response.status === 428) {
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
				console.log('erro no processPayment', e.response)
				throw Error(e)
			}
		}
	}
}
