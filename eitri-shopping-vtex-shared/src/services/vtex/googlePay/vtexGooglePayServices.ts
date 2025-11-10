import Eitri from 'eitri-bifrost'
import VtexCartService from './../cart/VtexCartService'

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

export class VtexGooglePayServices {
	static async loadPaymentData(env: 'PRODUCTION' | 'TEST' = 'PRODUCTION'): Promise<PaymentPayload> {
		const googlePayAvailable = await Eitri.googlePay.isAvailable()
		if (!googlePayAvailable) {
			throw new Error('google.pay.not.available')
		}

		const remoteConfig = await Eitri.environment.getRemoteConfigs()

		const account = remoteConfig?.providerInfo?.account
		const host = window.location.host
		const wellHubUrl = `https://wallet-hub.services.vtexpayments.com/wallet-hub/pub/wallets/googlePay/merchant-info?merchantOrigin=${host}&an=${account}`
		const res = await Eitri.http.get(wellHubUrl)
		const walletHub = res.data

		const cart = await VtexCartService.getCartIfExists()
		const paymentSystems = cart?.paymentData?.paymentSystems
		const allowedCards = paymentSystems.filter(ps => ps.groupName === 'creditCardPaymentGroup')

		const allowedGooglePayCards = ['MASTERCARD', 'AMEX', 'ELO', 'VISA']
		const allowedCardNetworks = allowedCards.map(c => c.name.toUpperCase())

		const paymentDataRequest = {
			apiVersion: 2,
			apiVersionMinor: 0,
			allowedPaymentMethods: [
				{
					type: 'CARD',
					parameters: {
						allowedAuthMethods: walletHub.allowedAuthMethods,
						allowedCardNetworks: allowedCardNetworks.filter(card => allowedGooglePayCards.includes(card)),
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

	}

	static async isAvailable (): Promise<Boolean> {
		if (!Eitri.canIUse(31)) {
			return false;
		}
		return await Eitri.googlePay.isAvailable()
	}
}
