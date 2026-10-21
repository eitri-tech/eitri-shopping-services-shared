import Eitri from 'eitri-bifrost'
import VtexCartService from './../cart/VtexCartService'
import VtexCaller from './../_helpers/_vtexCaller'
import { sendLogError } from '@/services/Datadog'

interface AssuranceDetails {
	cardHolderAuthenticated: boolean;
	accountVerified: boolean;
}

interface PaymentData<BillingAddress = any> {
	assuranceDetails: AssuranceDetails;
	billingAddress: BillingAddress;
	token: string | Record<string, unknown>;
}

interface PaymentPayload<BillingAddress = any> {
	walletId: 'googlePay';
	paymentData: PaymentData<BillingAddress>;
}

const EITRI_CAPABILITY_GOOGLE_PAY = 31

export class VtexGooglePayServices {
	static async loadPaymentData(env: 'PRODUCTION' | 'TEST' = 'PRODUCTION'): Promise<PaymentPayload> {
		const googlePayAvailable = await Eitri.googlePay.isAvailable()
		if (!googlePayAvailable) {
			throw new Error('google.pay.not.available')
		}

		try {
			const remoteConfig = await Eitri.environment.getRemoteConfigs()

			const account = remoteConfig?.providerInfo?.account
			const host = window.location.host
			const wellHubUrl = `/api/wallet-hub/pub/wallets/googlePay/merchant-info?merchantOrigin=${host}&an=${account}`
			const res = await VtexCaller.get(wellHubUrl)
			const walletHub = res.data

			const cart = await VtexCartService.getCartIfExists()
			const paymentSystems = cart?.paymentData?.paymentSystems
			const allowedCards = paymentSystems.filter((ps: any) => ps.groupName === 'creditCardPaymentGroup')

			const allowedGooglePayCards = ['MASTERCARD', 'AMEX', 'ELO', 'VISA']
			const allowedCardNetworks = allowedCards.map((c: any) => c.name.toUpperCase())

			const paymentDataRequest = {
				apiVersion: 2,
				apiVersionMinor: 0,
				allowedPaymentMethods: [
					{
						type: 'CARD',
						parameters: {
							allowedAuthMethods: walletHub.allowedAuthMethods,
							allowedCardNetworks: allowedCardNetworks.filter((card: any) => allowedGooglePayCards.includes(card)),
							assuranceDetailsRequired: true,
							billingAddressRequired: true,
							billingAddressParameters: {
								format: 'FULL'
							},
							cvcRequired: true
						},
						tokenizationSpecification: {
							type: 'PAYMENT_GATEWAY',
							parameters: {
								gateway: 'vtex',
								gatewayMerchantId: 'vtex'
							}
						}
					}
				],
				transactionInfo: {
					countryCode: remoteConfig?.storePreferences?.countryCode || 'BR',
					currencyCode: remoteConfig?.storePreferences?.currencyCode || 'BRL',
					totalPriceStatus: 'FINAL',
					totalPrice: (cart.value / 100).toFixed(2),
					totalPriceLabel: 'Total'
				},
				merchantInfo: {
					merchantId: walletHub.merchantId,
					merchantOrigin: walletHub.merchantOrigin,
					merchantName: walletHub.merchantName,
					authJwt: walletHub.authJwt
				}
			}

			const paymentsClient = await Eitri.googlePay.init(env)
			return await paymentsClient.loadPaymentData(paymentDataRequest)
		} catch (e: any) {
			sendLogError(e, 'loadPaymentData', { env: env ?? null, orderFormId: (VtexCartService._CACHED_CART as any)?.orderFormId ?? null })
			throw e
		}
	}

	static async isAvailable (): Promise<Boolean> {
		try {
			if (!Eitri.canIUse(EITRI_CAPABILITY_GOOGLE_PAY)) {
				return false;
			}
			return await Eitri.googlePay.isAvailable()
		} catch (e: any) {
			sendLogError(e, 'googlePay.isAvailable')
			throw e
		}
	}
}
