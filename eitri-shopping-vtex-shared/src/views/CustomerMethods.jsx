import Vtex from '../services/Vtex'

export default function CustomerMethods() {
	const [email, setEmail] = useState('')
	const [accessKey, setAccessKey] = useState('')
	const [password, setPassword] = useState('')
	const [newPass, setNewPass] = useState('')

	const sendEmail = async () => {
		await Vtex.customer.sendAccessKeyByEmail(email)
	}

	const loginWithEmailAndAccessKey = async () => {
		console.log('loginWithEmailAndAccessKey', email, accessKey)
		const result = await Vtex.customer.loginWithEmailAndAccessKey(email, accessKey)
		console.log('loginWithEmailAndAccessKey', result)
	}

	const loginWithPassword = async () => {
		try {
			console.log('loginWithPassword', email, password)
			const result = await Vtex.customer.loginWithEmailAndPassword(email, password)
			console.log('loginWithPassword', result)
		} catch (e) {
			console.log('loginWithPassword error', e)
		}
	}

	const isLogged = async () => {
		const logged = await Vtex.customer.isLoggedIn()
		console.log('isLogged', logged)
	}

	const getMyStoredToken = async () => {
		const savedToken = await Vtex.customer.getStorageCustomerToken()
		console.log('savedToken', savedToken)
	}

	const googleAuth = async () => {
		await Vtex.customer.loginWithGoogle()
	}

	const oauthLogin = async () => {
		try {
			await Vtex.customer.vtexOAuth()
		} catch (e) {
			console.log('oauthLogin error', e)
		}
	}

	const facebookAuth = async () => {
		await Vtex.customer.loginWithFacebook()
	}

	const executeRefreshToken = async () => {
		const savedToken = await Vtex.customer.executeRefreshToken()
		console.log('savedToken', savedToken)
	}

	const getLoggedCustomer = async () => {
		try {
			const result = await Vtex.customer.getCustomerProfile()
			console.log('savedToken', result)
		} catch (e) {
			console.log('getLoggedCustomer error', e)
		}
	}

	const executeLogout = async () => {
		const savedToken = await Vtex.customer.logout()
		console.log('savedToken', savedToken)
	}

	const updatePassword = async () => {
		try {
			console.log('updatePassword', email, accessKey, newPass)
			const result = await Vtex.customer.setPassword(email, accessKey, newPass)
			console.log('updatePassword', result)
		} catch (e) {
			console.log('updatePasswordError', e)
		}
	}

	const getAddresses = async () => {
		try {
			const result = await Vtex.customer.getAddresses()
			console.log('getAddresses', result)
		} catch (e) {
			console.log('getAddresses', e)
		}
	}

	const createAddress = async () => {
		try {
			const result = await Vtex.customer.createAddress({
				addressName: 'Casa dos testes',
				addressType: 'residential',
				city: 'Rio de Janeiro',
				complement: 'Casa 3',
				country: 'BRA',
				neighborhood: 'Andaraí',
				number: '792',
				postalCode: '20541-290',
				receiverName: 'Seu Teste',
				reference: null,
				state: 'RJ',
				street: 'Rua dos testes'
			})
			console.log('createAddress', result)
		} catch (e) {
			console.log('createAddress', e)
		}
	}

	const updateAddress = async () => {
		try {
			const result = await Vtex.customer.updateAddress('2c2sxbbz6z', {
				addressName: 'Casa dos testes',
				addressType: 'residential',
				city: 'Rio de Janeiro',
				complement: 'Casa 10',
				country: 'BRA',
				neighborhood: 'Andaraí',
				number: '792',
				postalCode: '20541-290',
				receiverName: 'Seu Teste',
				reference: null,
				state: 'RJ',
				street: 'Rua dos testes'
			})
			console.log('updateAddress', result)
		} catch (e) {
			console.log('updateAddress', e)
		}
	}

	const deleteAddress = async () => {
		try {
			const result = await Vtex.customer.deleteAddress('wobcew7v0jf')
			console.log('deleteAddress', result)
		} catch (e) {
			console.log('deleteAddress', e)
		}
	}

	const setRegion = async () => {
		try {
			const result = await Vtex.customer.setRegion('20541-195')
			console.log('deleteAddress', result)
		} catch (e) {
			console.log('deleteAddress', e)
		}
	}

	const removeRegion = async () => {
		try {
			const result = await Vtex.customer.removeRegion()
			console.log('deleteAddress', result)
		} catch (e) {
			console.log('deleteAddress', e)
		}
	}

	const getStoredRegionData = async () => {
		try {
			const result = await Vtex.customer.getStoredRegionData()
			console.log('getStoredRegionData', result)
		} catch (e) {
			console.log('deleteAddress', e)
		}
	}

	const addPaymentData = async () => {
		try {
			const cardData = {
					cardNumber: '4111111111111111',
					cardHolder: 'Wagner Felipe',
					expiryDate: '05/30',
					csc: '123',
					paymentSystem: 'Mastercard',
					document: '12345678909',
					documentType: 'cpf',
					address: {
						addressType: 'residential',
						city: 'Rio de Janeiro',
						complement: 'Apto 201',
						country: 'BRA',
						geoCoordinates: [-43.25596618652344, -22.926231384277344],
						neighborhood: 'Grajaú',
						number: '30',
						postalCode: '20541-290',
						receiverName: 'Wagner Felipe',
						reference: '',
						state: 'RJ',
						street: 'Rua Guamerim',
						addressQuery: null
					}
				}

			const result = await Vtex.customer.addNewCard(cardData, "captchaToken")
			console.log('addPaymentData', result)
		} catch (e) {
			console.log('addPaymentData', e)
		}
	}

	const getCards = async () => {
		try {
			const result = await Vtex.customer.getSavedCards()
			console.log('getCards', result)
		} catch (e) {
			console.log('getCards', e)
		}
	}

	const deleteCard = async () => {
		try {
			const result = await Vtex.customer.deleteSavedCard('94DA5D162B964F4EA40C41483A594583')
			console.log('deleteCard', result)
		} catch (e) {
			console.log('deleteCard', e)
		}
	}

	const METHODS = [
		{ label: 'Logado?', executor: isLogged },
		{ label: 'Google login', executor: googleAuth },
		{ label: 'Oauth Login', executor: oauthLogin },
		{ label: 'Facebook login', executor: facebookAuth },
		{ label: 'Meu token', executor: getMyStoredToken },
		{ label: 'Refresh token', executor: executeRefreshToken },
		{ label: 'Obter usuário logado', executor: getLoggedCustomer },
		{ label: 'Obter endereços', executor: getAddresses },
		{ label: 'Criar endereço', executor: createAddress },
		{ label: 'Atualizar endereço', executor: updateAddress },
		{ label: 'Excluir endereço', executor: deleteAddress },
		{ label: 'Logout', executor: executeLogout },
		{ label: 'Definir região', executor: setRegion },
		{ label: 'Remover região', executor: removeRegion },
		{ label: 'Obter região', executor: getStoredRegionData },
		{ label: 'Adicionar dados de pagamento', executor: addPaymentData },
		{ label: 'Obter cartões salvos', executor: getCards },
		{ label: 'Excluir cartão', executor: deleteCard }
	]

	return (
		<Window
			topInset
			bottomInset>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
				<View
					display='flex'
					gap={10}>
					<Input
						placeholder='Email'
						grow={4}
						value={email}
						onChange={value => setEmail(value)}
					/>
					<Button
						color='background-color'
						grow={1}
						onPress={sendEmail}
						label='Enviar email'
					/>
				</View>
				<View
					display='flex'
					gap={10}>
					<Input
						placeholder='Password'
						inputType='text'
						grow={4}
						value={password}
						onChange={value => setPassword(value)}
					/>
					<Button
						color='background-color'
						grow={1}
						onPress={loginWithPassword}
						label='Acesso com senha'
					/>
				</View>
				<View
					display='flex'
					gap={10}>
					<Input
						placeholder='Access Key'
						inputType='numeric'
						grow={4}
						value={accessKey}
						onChange={value => setAccessKey(value)}
					/>
					<Button
						color='background-color'
						grow={1}
						onPress={loginWithEmailAndAccessKey}
						label='Validar login'
					/>
				</View>
				<View
					display='flex'
					gap={10}>
					<Input
						placeholder='Nova senha'
						inputType='numeric'
						grow={4}
						value={newPass}
						onChange={value => setNewPass(value)}
					/>
					<Button
						color='background-color'
						grow={1}
						onPress={updatePassword}
						label='Nova senha'
					/>
				</View>
				{METHODS.map(method => (
					<Button
						wide
						color='background-color'
						onPress={method.executor}
						label={method.label}
					/>
				))}
			</View>
		</Window>
	)
}
