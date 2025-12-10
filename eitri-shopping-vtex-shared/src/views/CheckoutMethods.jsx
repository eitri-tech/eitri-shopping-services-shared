import Vtex from '../services/Vtex'
import Eitri from 'eitri-bifrost'
import Recaptcha from '@/recaptcha/Recaptcha'

export default function CheckoutMethods() {

	const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('')

	const recaptchaRef = useRef()

	useEffect(() => {
		Eitri.environment.getRemoteConfigs().then(rc => {
			const recaptchaSiteKey = rc?.appConfigs?.checkout?.recaptchaKey
			if (recaptchaSiteKey) {
				setRecaptchaSiteKey(recaptchaSiteKey)
			}
		})
	}, [])

	const getCart = async () => {
		const cart = await Vtex.cart.getCurrentOrCreateCart()
		console.log('carrinho=====>', cart.orderFormId)
	}

	const addUser = async () => {
		try {
			await Vtex.checkout.addUserData({
				email: 'kexibod34@cronack.com',
				firstName: 'Teste',
				lastName: 'Teste',
				documentType: 'cpf',
				document: '249.758.540-74',
				phone: '(11) 91234-5678',
				dob: '1990-05-15',
				isCorporate: false,
				corporateName: '',
				tradeName: '',
				corporateDocument: '',
				corporatePhone: '',
				stateInscription: ''
			})
		} catch (e) {
			console.error(e)
		}
	}

	const addRandomItem = async () => {
		const products = await Vtex.catalog.legacyParamsSearch('fq=P:%5B0%2520TO%252099999%5D&_from=0&_to=49')
		const product = products[Math.floor(Math.random() * products.length)]
		const sku = product.items[0]
		const result = await Vtex.cart.addItem(sku)
		// console.log(result)
	}

	const selectShipping = async () => {
		await Vtex.checkout.setLogisticInfo({
			clearAddressIfPostalCodeNotFound: false,
			selectedAddresses: [
				{
					addressType: 'residential',
					receiverName: 'Wagner Quirino',
					addressId: '8f7f3d3715ec488bbadbb936e6978fc2',
					isDisposable: true,
					postalCode: '20541195',
					city: 'Rio de Janeiro',
					state: 'RJ',
					country: 'BRA',
					street: 'Rua Paula Brito',
					number: '600',
					neighborhood: 'Andaraí',
					complement: '',
					reference: '',
					geoCoordinates: [-43.25407028198242, -22.9276180267334]
				}
			],
			logisticsInfo: [
				{
					itemIndex: 0,
					selectedDeliveryChannel: 'delivery',
					selectedSla: 'NORMAL'
				}
			]
		})
	}

	const selectPayment = async () => {
		const cart = await Vtex.cart.getCurrentOrCreateCart()

		const paymentSystem = 2
		const installmentsNumber = 1

		const pay = cart.paymentData.paymentSystems.find(p => p.id === paymentSystem)
		const installmentOption = cart?.paymentData.installmentOptions.find(i => i.paymentSystem === pay.id.toString())
		const installment = installmentOption.installments.find(i => i.count === installmentsNumber)

		const payment = {
			paymentSystem: pay.id,
			paymentSystemName: pay.name,
			group: pay.groupName,
			installments: installment.count,
			installmentsInterestRate: installment.interestRate,
			installmentsValue: installment.value,
			value: installment.total,
			referenceValue: cart.value,
			hasDefaultBillingAddress: true
		}
		const giftCard = {
			redemptionCode: 'QPZG-HSCT-IDJR-SQLG',
			inUse: true
		}

		try {
			const result = await Vtex.checkout.selectPaymentOption({
				payments: [payment],
				giftCards: [giftCard]
			})
			console.log(result?.paymentData?.payments)
			console.log(result?.paymentData?.giftCards)
		} catch (error) {
			console.error(error)
		}
	}

	const pay = async () => {
		try {
			const cart = await Vtex.cart.getCurrentOrCreateCart()

			const captchaToken = await recaptchaRef?.current?.getRecaptchaToken()
			console.log("captchaToken", captchaToken)

			const payload = {
				fields: {
					holderName: 'Joao Teste',
					cardNumber: '4929 0917 7269 4617',
					validationCode: '123',
					dueDate: '12/26',
					address: {
						street: 'Rua Guame',
						complement: '',
						number: '12',
						city: 'Rio de Janeiro',
						reference: '',
						neighborhood: 'Grajau',
						state: 'Rio de Janeiro',
						country: 'Brasil',
						postalCode: '20541290'
					}
				},
				captchaToken: captchaToken,
				captchaSiteKey: recaptchaSiteKey,
				savePersonalData: true,
				optinNewsLetter: false
			}

			const result = await Vtex.checkout.payV2(cart, payload)
			// const result = await Vtex.checkout.executePayment(cart, {
			// 	holderName: 'Joao Teste',
			// 	cardNumber: '4929 0917 7269 4617',
			// 	validationCode: '123',
			// 	dueDate: '12/26',
			// 	address: {
			// 		street: 'Rua Guame',
			// 		complement: '',
			// 		number: '12',
			// 		city: 'Rio de Janeiro',
			// 		reference: '',
			// 		neighborhood: 'Grajau',
			// 		state: 'Rio de Janeiro',
			// 		country: 'Brasil',
			// 		postalCode: '20541290'
			// 	}
			// })
			console.log(result)
		} catch (e) {
			console.log(e)
		}
	}

	const googlePay = async () => {
		const googlePayAvailable = await Eitri.googlePay.isAvailable();
		if (!googlePayAvailable) {
			return;
		}

		const paymentsClient = await Eitri.googlePay.init("PRODUCTION"); // or "PRODUCTION"

		const host = window.location.host;

		const res = await Eitri.http.get(`https://wallet-hub.services.vtexpayments.com/wallet-hub/pub/wallets/googlePay/merchant-info?merchantOrigin=${host}&an=toymania`);

		const merchantInfo = res.data

		const cart = await Vtex.cart.getCurrentOrCreateCart()


		const paymentDataRequest = {
			"apiVersion": 2,
			"apiVersionMinor": 0,
			"allowedPaymentMethods": [
				{
					"type": "CARD",
					"parameters": {
						"allowedAuthMethods": [
							"PAN_ONLY"
						],
						"allowedCardNetworks": [
							"MASTERCARD",
							"AMEX",
							"ELO",
							"VISA"
						],
						"assuranceDetailsRequired": true,
						"billingAddressRequired": true,
						"billingAddressParameters": {
							"format": "FULL"
						},
						"cvcRequired": true
					},
					"tokenizationSpecification": {
						"type": "PAYMENT_GATEWAY",
						"parameters": {
							"gateway": "vtex",
							"gatewayMerchantId": "vtex"
						}
					}
				}
			],
			"transactionInfo": {
				"countryCode": "BR",
				"currencyCode": "BRL",
				"totalPriceStatus": "FINAL",
				"totalPrice": (cart.value / 100).toFixed(2),
				"totalPriceLabel": "Total"
			},
			merchantInfo: {
				merchantId: merchantInfo.merchantId,
				merchantOrigin: merchantInfo.merchantOrigin,
				merchantName: merchantInfo.merchantName,
				authJwt: merchantInfo.authJwt,
			}
		}

		console.log("Payment Data Request:", paymentDataRequest);

		try {
			const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

			const token = paymentData.paymentMethodData.tokenizationData.token
			const billingAddress = paymentData.paymentMethodData.info.billingAddress

			const payload = {
				fields: {
					"metadata": JSON.stringify({
						"walletId": "googlePay",
						"paymentData": {
							"assuranceDetails": {
								"cardHolderAuthenticated": false,
								"accountVerified": true
							},
							"billingAddress": billingAddress,
							"token": token
						}
					})
				},
				captchaToken: '',
				captchaSiteKey: '',
				savePersonalData: true,
				optinNewsLetter: false
			}

			console.log("Payment Data:", payload);

			const result = await Vtex.checkout.payV2(cart, payload)


			console.log("Payment successful:", paymentData.paymentMethodData);
		} catch (error) {
			console.error("Payment failed:", error);
		}
	}

	return (
		<Window
			topInset
			bottomInset
			title='Métodos de checkout'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				width='100%'>
				<Button
					wide
					color='background-color'
					onPress={getCart}
					label='Obter carrinho'
				/>

				<Button
					wide
					color='background-color'
					onPress={addRandomItem}
					label='Adicionar item aleatório'
				/>

				<Button
					wide
					color='background-color'
					onPress={addUser}
					label='Adicionar usuário'
				/>

				<Button
					wide
					color='background-color'
					onPress={selectShipping}
					label='Selecionar opção de entrega'
				/>

				<Button
					wide
					color='background-color'
					onPress={selectPayment}
					label='Selecionar opção de pagamento'
				/>

				<Button
					wide
					color='background-color'
					onPress={pay}
					label='Pagar'
				/>

				<Button
					wide
					color='background-color'
					onPress={googlePay}
					label='Pagar com Google Pay'
				/>
			</View>
			{recaptchaSiteKey && (
				<Recaptcha
					ref={recaptchaRef}
					siteKey={recaptchaSiteKey}
				/>
			)}
		</Window>
	)
}
