import Vtex from '../services/Vtex'
import Eitri from 'eitri-bifrost'
import Recaptcha from '@/recaptcha/Recaptcha'
import { VtexGooglePayServices } from '@/services/vtex/googlePay/vtexGooglePayServices'
import VtexCartService from '@/services/vtex/cart/VtexCartService'

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
				email: 'fake.wagnerfq@gmail.com',
				firstName: 'Wagner',
				lastName: 'Fake',
				documentType: 'cpf',
				document: '123.456.789-09',
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
		const installment = installmentOption?.installments?.find(i => i.count === installmentsNumber)

		const payment = {
			paymentSystem: pay.id,
			paymentSystemName: pay.name,
			group: pay.groupName,
			installments: installment?.count ?? 1,
			installmentsInterestRate: installment?.interestRate ?? 0,
			installmentsValue: installment?.value ?? cart.value,
			value: installment?.total ?? cart.value,
			referenceValue: cart.value,
			hasDefaultBillingAddress: true
		}
		// console.log("payment=======>", payment)
		const giftCard = {
			redemptionCode: 'KLLU-JRCC-RTAL-TSDY',
			inUse: true,
			isSpecialCard: false
		}

		try {
			const result = await Vtex.checkout.selectPaymentOption({
				payments: [payment],
				giftCards: []
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
					cardNumber: ' 6363 6800 0000 0007',
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

		const paymentData = await VtexGooglePayServices.loadPaymentData()

		const cart = await VtexCartService.getCartIfExists()


		console.log('Payment Data Request:', paymentData)

		try {

			const payload = {
				fields: paymentData,
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
