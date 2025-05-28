import VtexCaller from '../_helpers/_vtexCaller'
import Vtex from '../../Vtex'
import Eitri from 'eitri-bifrost'
import Logger from '../../Logger'
import VtexCartService from '../cart/VtexCartService'
import GAVtexInternalService from '../../tracking/GAVtexInternalService'
import App from '../../App'
import vtexCustomerService from '../customer/vtexCustomerService'

export default class VtexCheckoutService {
	static async selectPaymentOption(paymentOption) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const payload = {
			payments: paymentOption.payments,
			giftCards: paymentOption.giftCards
		}

		// Tem um erro na Vtex, quando existe gift card só é possível enviar o header VtexIdclientAutCookie_userId
		let overrideHeaders = null
		if (Array.isArray(payload?.giftCards) && payload?.giftCards.length > 0) {
			const userId = await vtexCustomerService.getCustomerData('userId')
			const token = await vtexCustomerService.getCustomerToken()
			if (token && userId) {
				overrideHeaders = {
					Cookie: `'VtexIdclientAutCookie_${userId}=${token}`
				}
			}
		}

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/paymentData`,
			payload,
			null,
			null,
			overrideHeaders
		)

		GAVtexInternalService.addPaymentInfo(response.data)

		return response.data
	}

	static async addShippingAddress(address) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const payload = {
			clearAddressIfPostalCodeNotFound: true,
			selectedAddresses: [address]
		}
		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/shippingData`,
			payload,
			{
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Cookie': `CheckoutOrderFormOwnership=; checkout.vtex.com=__ofid=${orderFormId}`
				}
			}
		)

		GAVtexInternalService.addShippingInfo(response.data)

		return response.data
	}

	static async setLogisticInfo(logisticInfo) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/shippingData`,
			logisticInfo,
			{
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Cookie': `CheckoutOrderFormOwnership=; checkout.vtex.com=__ofid=${orderFormId}`
				}
			}
		)

		GAVtexInternalService.addShippingInfo(response.data)

		return response.data
	}

	static async addPromoCode(couponCode) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const payload = { text: couponCode }

		const response = await VtexCaller.post(`api/checkout/pub/orderForm/${orderFormId}/coupons`, payload)

		return response.data
	}

	static async addUserData(userData) {
		const orderFormId = await VtexCartService.getStoredOrderFormId()

		const response = await VtexCaller.post(
			`api/checkout/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
			userData,
			{
				headers: {
					Cookie: `CheckoutOrderFormOwnership=; checkout.vtex.com=__ofid=${orderFormId}`
				}
			}
		)

		return response.data
	}

	// PAGAMENTO COMEÇA AQUI //
	static extractCookieValues(cookieString) {
		const vtexChkoAuthRegex = /Vtex_CHKO_Auth=(.*?);/
		const checkoutDataAccessRegex = /CheckoutDataAccess=VTEX_CHK_Order_Auth=(.*?);/

		const vtexMatch = cookieString.match(vtexChkoAuthRegex)
		const checkoutMatch = cookieString.match(checkoutDataAccessRegex)

		const vtex_CHKO_Auth = vtexMatch ? vtexMatch[1] : ''
		const checkoutDataAccess = checkoutMatch ? checkoutMatch[1] : ''

		return {
			Vtex_CHKO_Auth: vtex_CHKO_Auth,
			CheckoutDataAccess: checkoutDataAccess
		}
	}

	static async startTransaction(orderFormId, payload) {
		console.log('====> Iniciando transação', orderFormId)
		Logger.log('====> Iniciando transação payload', payload)
		console.time('startTransaction')

		try {
			const result = await VtexCaller.post(`api/checkout/pub/orderForm/${orderFormId}/transaction`, payload, {
				headers: {
					'accept': 'application/json, text/javascript, */*; q=0.01',
					'content-type': 'application/json'
				}
			})

			const transactionData = result.data

			const { id, orderGroup, merchantTransactions } = transactionData

			const { Vtex_CHKO_Auth, CheckoutDataAccess } = VtexCheckoutService.extractCookieValues(
				result.headers['set-cookie']
			)

			console.timeEnd('startTransaction')

			console.log('====> Transaçao finalizada com sucesso com transactionId', id)
			Logger.log('====> Transaçao finalizada com sucesso', {
				id,
				orderGroup,
				Vtex_CHKO_Auth,
				CheckoutDataAccess
			})

			return {
				id,
				orderGroup,
				Vtex_CHKO_Auth,
				CheckoutDataAccess,
				merchantTransactions
			}
		} catch (e) {
			console.log('erro no startPayment', e)
		}
	}

	static async setPaymentMethod(transactionId, payload) {
		console.log('====> Setando o método de pagamento', transactionId)
		Logger.log('====> Setando o método de pagamento com o payload', payload)

		console.time('setPaymentMethod')

		try {
			const result = await Eitri.http.post(
				`https://${Vtex.configs.account}.vtexpayments.com.br/api/pub/transactions/${transactionId}/payments`,
				payload,
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
			console.log('====> Método de pagamento definido para o transactionId', transactionId)
		} catch (e) {
			//TODO: se der erro aqui, será necessário matar e recriar o carrinho
			console.log('erro no setPaymentMethod', e)
		}
	}

	static async processPayment(orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, transactionId) {
		console.log('====> Processando o pagamento', orderGroup)
		Logger.log('====> Processando o pagamento', { orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess })

		try {
			await VtexCaller.post(`/api/checkout/pub/gatewayCallback/${orderGroup}`, null, {
				headers: {
					'accept': 'application/json, text/javascript, */*; q=0.01',
					'content-type': 'application/json',
					'user-agent':
						'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
					'Cookie': `Vtex_CHKO_Auth=${Vtex_CHKO_Auth};CheckoutDataAccess=VTEX_CHK_Order_Auth=${CheckoutDataAccess}`
				}
			})
			console.log('=====> Pagamento processado com sucesso', orderGroup)
			return { orderId: orderGroup, transactionId, status: 'completed' }
		} catch (e) {
			console.timeEnd('processPayment')
			if (!e.response.data) {
				console.log('erro no processPayment no content', e.response)
				throw Error(e)
			}

			if (e.response.status === 428) {
				console.log('=====> Pagamento processado com sucesso status 428', orderGroup, e.response.data)
				return {
					orderId: orderGroup,
					transactionId,
					status: 'waiting_payment',
					...e.response.data
				}
			} else {
				console.log('erro no processPayment', e.response)
				throw Error(e)
			}
		}
	}

	static async pay(cart, cardInfo, captchaToken, captchaSiteKey, options) {
		console.log('==========Iniciando pagamento==========')
		console.time('Pay total time')

		const payment = cart.paymentData?.payments[0]

		const paymentSystem = cart.paymentData?.paymentSystems?.find(
			system => system.stringId === payment.paymentSystem
		)

		// Boleto bancário
		if (paymentSystem.groupName === 'bankInvoicePaymentGroup') {
			return await VtexCheckoutService.payBankInvoice(cart)
		}

		// Pix
		if (paymentSystem.groupName === 'instantPaymentPaymentGroup') {
			return await VtexCheckoutService.payInstantPayment(cart)
		}

		//Cartão de Crédito
		if (paymentSystem.groupName === 'creditCardPaymentGroup') {
			return await VtexCheckoutService.payWithCard(cart, cardInfo, captchaToken, captchaSiteKey)
		}

		//Promissoria
		if (paymentSystem.groupName === 'promissoryPaymentGroup') {
			return await VtexCheckoutService.payPromissory(cart)
		}

		//Cartao de loja
		const storeCardGroupName = App?.configs?.appConfigs.storeCardGroupName ?? ''
		if (paymentSystem.groupName === storeCardGroupName) {
			return await VtexCheckoutService.payStoreCart(cart, cardInfo, paymentSystem.groupName, options)
		}

		const externalPaymentsImplementation = App?.configs?.appConfigs.externalPayments ?? []

		if (
			externalPaymentsImplementation.some(
				externalPayment => externalPayment.externalGroupName === paymentSystem?.groupName
			)
		) {
			const res = await VtexCheckoutService.payExternalProvider(cart)
			GAVtexInternalService.purchase(cart, res.transactionId)
			return res
		}

		console.time('Pay total time')

		throw Error('Método de pagamento não suportado')
	}

	static async getPixStatus(transactionId, paymentId) {
		try {
			const result = await Eitri.http.get(
				`https://${Vtex.configs.account}.myvtex.com/_v/private/pix/status/${transactionId}/payments/${paymentId}`,
				{
					headers: {
						'accept': 'application/json, text/javascript, */*; q=0.01',
						'content-type': 'application/json',
						'user-agent':
							'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
					}
				}
			)
			return result.data
		} catch (e) {
			console.log('erro no getPixStatus', e)
		}
	}

	static async resolveZipCode(zipcode) {
		const response = await VtexCaller.get(`api/checkout/pub/postal-code/BRA/${zipcode}`)
		return response.data
	}

	static getGiftCartPaymentMethod(cart, transaction) {
		if (!(cart?.paymentData?.giftCards?.length > 0)) {
			return null
		}

		const giftCardPaymentSystem = cart?.paymentData?.paymentSystems?.find(
			system => system.groupName === 'giftCardPaymentGroup'
		)

		if (!giftCardPaymentSystem) {
			return null
		}

		return cart.paymentData.giftCards.map(giftCard => {
			return {
				paymentSystem: giftCardPaymentSystem.id,
				paymentSystemName: giftCardPaymentSystem.name,
				group: 'giftCardPaymentGroup',
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
					...transaction
				}
			}
		})
	}

	// Payments
	static async payBankInvoice(cart) {
		console.log('===> Pagamento de boleto')

		const payment = cart.paymentData?.payments[0]

		const { id, orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, merchantTransactions } =
			await VtexCheckoutService.startTransaction(cart.orderFormId, {
				referenceId: cart.orderFormId,
				savePersonalData: true,
				optinNewsLetter: false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: 1
			})

		const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

		const paymentMethod = [
			{
				paymentSystem: payment.paymentSystem,
				paymentSystemName: 'Boleto Bancário',
				group: 'bankInvoicePaymentGroup',
				installments: 1,
				installmentsInterestRate: 0,
				installmentsValue: cart.value,
				value: cart.value,
				referenceValue: cart.value,
				id: merchantTransaction?.id || payment.merchantSellerPayments[0].id,
				interestRate: 0,
				installmentValue: cart.value,
				transaction: {
					id: id,
					merchantName: merchantTransaction?.merchantName || payment.merchantSellerPayments[0].id
				},
				currencyCode: App.configs?.storePreferences?.currencyCode,
				originalPaymentIndex: 0
			}
		]

		await VtexCheckoutService.setPaymentMethod(id, paymentMethod)

		const processedPayment = await VtexCheckoutService.processPayment(
			orderGroup,
			Vtex_CHKO_Auth,
			CheckoutDataAccess,
			id
		)

		GAVtexInternalService.purchase(cart, processedPayment.orderGroup)

		return processedPayment
	}

	static async payInstantPayment(cart) {
		console.log('===> Pagamento via Pix')

		const payment = cart.paymentData?.payments[0]

		const { id, orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, merchantTransactions } =
			await VtexCheckoutService.startTransaction(cart.orderFormId, {
				referenceId: cart.orderFormId,
				savePersonalData: true,
				optinNewsLetter: false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: 0
			})

		const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

		const paymentMethod = [
			{
				paymentSystem: payment.paymentSystem,
				paymentSystemName: 'Pix',
				group: 'instantPaymentPaymentGroup',
				installments: 1,
				installmentsInterestRate: 0,
				installmentsValue: cart.value,
				value: cart.value,
				referenceValue: cart.value,
				id: merchantTransaction?.id || payment.merchantSellerPayments[0].id,
				interestRate: 0,
				installmentValue: cart.value,
				transaction: {
					id: id,
					merchantName: merchantTransaction?.merchantName || payment.merchantSellerPayments[0].id
				},
				currencyCode: App.configs?.storePreferences?.currencyCode,
				originalPaymentIndex: 0
			}
		]

		await VtexCheckoutService.setPaymentMethod(id, paymentMethod)

		const processedPayment = await VtexCheckoutService.processPayment(
			orderGroup,
			Vtex_CHKO_Auth,
			CheckoutDataAccess,
			id
		)

		GAVtexInternalService.purchase(cart, processedPayment.orderGroup)

		return processedPayment
	}

	static async payWithCard(cart, cardInfo, captchaToken, captchaSiteKey) {
		console.log('===> Pagamento via Cartão de Crédito')

		const payment = cart.paymentData?.payments[0]

		const { id, orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, merchantTransactions } =
			await VtexCheckoutService.startTransaction(cart.orderFormId, {
				referenceId: cart.orderFormId,
				savePersonalData: true,
				optinNewsLetter: false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: 0,
				recaptchaKey: captchaSiteKey,
				recaptchaToken: captchaToken
			})

		const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

		const cardInfoFields = () => {
			if (cardInfo.billingAddress.postalCode && cardInfo.billingAddress.city) {
				return {
					holderName: cardInfo.holderName,
					cardNumber: cardInfo.cardNumber,
					validationCode: cardInfo.securityCode,
					dueDate: cardInfo.expirationDate.slice(0, 2) + '/' + cardInfo.expirationDate.slice(2, 4),
					bin: cart.paymentData.payments[0].bin,
					address: {
						street: cardInfo.billingAddress.street,
						complement: cardInfo.billingAddress.complement,
						number: cardInfo.billingAddress.number,
						city: cardInfo.billingAddress.city,
						reference: cardInfo.billingAddress.reference,
						neighborhood: cardInfo.billingAddress.neighborhood,
						state: cardInfo.billingAddress.state,
						country: cardInfo.billingAddress.country,
						postalCode: cardInfo.billingAddress.postalCode
					}
				}
			} else {
				return {
					holderName: cardInfo.holderName,
					cardNumber: cardInfo.cardNumber,
					validationCode: cardInfo.securityCode,
					dueDate: cardInfo.expirationDate.slice(0, 2) + '/' + cardInfo.expirationDate.slice(2, 4),
					bin: cart.paymentData.payments[0].bin,
					addressId: cart.shippingData.address.addressId
				}
			}
		}

		const creditCardPaymentPayload = [
			{
				hasDefaultBillingAddress: true,
				isLuhnValid: true,
				installmentsInterestRate: payment.merchantSellerPayments[0].interestRate,
				referenceValue: cart.value,
				bin: payment.bin,
				value: cart.value,
				paymentSystem: payment.paymentSystem,
				isBillingAddressDifferent: false,
				fields: cardInfoFields(),
				installments: payment.merchantSellerPayments[0].installments,
				chooseToUseNewCard: true,
				isRegexValid: true,
				id: merchantTransaction?.id || payment.merchantSellerPayments[0].id,
				interestRate: payment.merchantSellerPayments[0].interestRate,
				installmentValue: payment.merchantSellerPayments[0].installmentValue,
				transaction: {
					id: id,
					merchantName: merchantTransaction?.merchantName || payment.merchantSellerPayments[0].id
				},
				installmentsValue: payment.merchantSellerPayments[0].installmentValue,
				currencyCode: App.configs?.storePreferences?.currencyCode,
				originalPaymentIndex: 0,
				groupName: 'creditCardPaymentGroup'
			}
		]

		await VtexCheckoutService.setPaymentMethod(id, creditCardPaymentPayload)

		const processedPayment = await VtexCheckoutService.processPayment(
			orderGroup,
			Vtex_CHKO_Auth,
			CheckoutDataAccess
		)

		GAVtexInternalService.purchase(cart, processedPayment.orderGroup)

		return processedPayment
	}

	static async payPromissory(cart) {
		console.log('===> Pagamento via Promissória')

		const payment = cart.paymentData?.payments[0]
		const paymentSystem = cart.paymentData?.paymentSystems?.find(ps => ps.stringId === payment.paymentSystem)

		const { id, orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, merchantTransactions } =
			await VtexCheckoutService.startTransaction(cart.orderFormId, {
				referenceId: cart.orderFormId,
				savePersonalData: true,
				optinNewsLetter: false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: 1
			})

		const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

		const paymentMethod = [
			{
				paymentSystem: payment.paymentSystem,
				paymentSystemName: paymentSystem.name,
				group: paymentSystem.groupName,
				installments: 1,
				installmentsInterestRate: 0,
				installmentsValue: payment.value,
				value: payment.value,
				referenceValue: payment.value,
				id: merchantTransaction?.id || payment.merchantSellerPayments[0].id,
				interestRate: 0,
				installmentValue: payment.value,
				transaction: {
					id: id,
					merchantName: merchantTransaction?.merchantName || payment.merchantSellerPayments[0].id
				},
				currencyCode: 'BRL',
				originalPaymentIndex: 0
			}
		]

		const giftCardMethods = VtexCheckoutService.getGiftCartPaymentMethod(cart, {
			id: id,
			merchantName: payment.merchantSellerPayments[0].id
		})

		if (giftCardMethods && giftCardMethods.length > 0) {
			giftCardMethods.forEach(method => paymentMethod.push(method))
		}

		await VtexCheckoutService.setPaymentMethod(id, paymentMethod)

		return await VtexCheckoutService.processPayment(orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, id)
	}

	static async payExternalProvider(cart) {
		console.log('===> Pagamento via External Provider')

		const payment = cart.paymentData?.payments[0]
		const paymentSystem = cart.paymentData?.paymentSystems?.find(ps => ps.stringId === payment.paymentSystem)

		const { id, orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, merchantTransactions } =
			await VtexCheckoutService.startTransaction(cart.orderFormId, {
				referenceId: cart.orderFormId,
				savePersonalData: true,
				optinNewsLetter: false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: 1
			})

		const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

		const paymentMethod = [
			{
				paymentSystem: payment.paymentSystem,
				paymentSystemName: paymentSystem.name,
				group: paymentSystem.groupName,
				installments: 1,
				installmentsInterestRate: 0,
				installmentsValue: payment.value,
				value: payment.value,
				referenceValue: payment.value,
				id: merchantTransaction?.id || payment.merchantSellerPayments[0].id,
				interestRate: 0,
				installmentValue: payment.value,
				transaction: {
					id: id,
					merchantName: merchantTransaction?.merchantName || payment.merchantSellerPayments[0].id
				},
				currencyCode: 'BRL',
				originalPaymentIndex: 0
			}
		]

		const giftCardMethods = VtexCheckoutService.getGiftCartPaymentMethod(cart, {
			id: id,
			merchantName: payment.merchantSellerPayments[0].id
		})

		if (giftCardMethods && giftCardMethods.length > 0) {
			giftCardMethods.forEach(method => paymentMethod.push(method))
		}

		await VtexCheckoutService.setPaymentMethod(id, paymentMethod)

		return await VtexCheckoutService.processPayment(orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, id)
	}

	static async payStoreCart(cart, cardInfo, groupName, options) {
		console.log('===> Pagamento via Cartão da Loja')

		const payment = cart.paymentData?.payments[0]

		const { id, orderGroup, Vtex_CHKO_Auth, CheckoutDataAccess, merchantTransactions } =
			await VtexCheckoutService.startTransaction(cart.orderFormId, {
				referenceId: cart.orderFormId,
				savePersonalData: options?.savePersonalData ?? true,
				optinNewsLetter: options?.optinNewsLetter ?? false,
				value: cart.value,
				referenceValue: cart.value,
				interestValue: 0
			})

		const merchantTransaction = merchantTransactions?.find(mt => mt.transactionId === id)

		const creditCardPaymentPayload = [
			{
				hasDefaultBillingAddress: true,
				isLuhnValid: true,
				installmentsInterestRate: payment.merchantSellerPayments[0].interestRate,
				referenceValue: cart.value,
				bin: payment.bin,
				value: cart.value,
				paymentSystem: payment.paymentSystem,
				fields: cardInfo,
				installments: payment.merchantSellerPayments[0].installments,
				isRegexValid: true,
				id: merchantTransaction?.id || payment.merchantSellerPayments[0].id,
				interestRate: payment.merchantSellerPayments[0].interestRate,
				installmentValue: payment.merchantSellerPayments[0].installmentValue,
				transaction: {
					id: id,
					merchantName: merchantTransaction?.merchantName || payment.merchantSellerPayments[0].id
				},
				installmentsValue: payment.merchantSellerPayments[0].installmentValue,
				currencyCode: App.configs?.storePreferences?.currencyCode,
				groupName: groupName
			}
		]

		await VtexCheckoutService.setPaymentMethod(id, creditCardPaymentPayload)

		const processedPayment = await VtexCheckoutService.processPayment(
			orderGroup,
			Vtex_CHKO_Auth,
			CheckoutDataAccess
		)

		GAVtexInternalService.purchase(cart, processedPayment.orderGroup)

		return processedPayment
	}
}
