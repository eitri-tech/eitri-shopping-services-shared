import Vtex from '../services/Vtex'

export default function CheckoutMethods() {
	const getCart = async () => {
		const cart = await Vtex.cart.getCurrentOrCreateCart()
		console.log('carrinho=====>', cart.orderFormId)
	}

	const addUser = async () => {
		try {
			await Vtex.checkout.addUserData({
				email: 'kexibod969@cronack.com',
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
		const payment = {
			paymentSystem: 4,
			paymentSystemName: 'Mastercard',
			group: 'creditCardPaymentGroup',
			installments: 1,
			installmentsInterestRate: 0,
			installmentsValue: 112500,
			value: 112500,
			referenceValue: 112500,
			hasDefaultBillingAddress: true
		}
		const giftCard = {
			redemptionCode: '',
			inUse: true
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
			const cardInfo = {
				bin: '11112222',
				cardNumber: '1111222233334444',
				deviceFingerprint: '77615142',
				document: '15538275035',
				dueDate: null,
				holderName: 'Joao teste',
				validationCode: null,
				billingAddress: {}
			}

			const payload = {
				fields: {
					holderName: 'Joao Teste',
					cardNumber: '1111222233334444',
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
				captchaToken: '',
				captchaSiteKey: '',
				savePersonalData: true,
				optinNewsLetter: false,
				interestValue: 0
			}

			const result = await Vtex.checkout.payV2(cart, payload)
			// const result = await Vtex.checkout.executePayment(cart, cardInfo)
			console.log(result)
		} catch (e) {
			console.log(e)
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
			</View>
		</Window>
	)
}
