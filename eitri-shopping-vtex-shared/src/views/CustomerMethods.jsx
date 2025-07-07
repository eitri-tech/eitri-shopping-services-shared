import Vtex from '../services/Vtex'
import Eitri from 'eitri-bifrost'

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
				width='100%'>
				<Button
					wide
					color='background-color'
					onPress={isLogged}
					label='Logado?'
				/>
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

				<View
					display='flex'
					gap={10}>
					<Button
						wide
						color='background-color'
						grow={1}
						onPress={googleAuth}
						label='Google login'
					/>
				</View>

				<View
					display='flex'
					gap={10}>
					<Button
						wide
						color='background-color'
						grow={1}
						onPress={facebookAuth}
						label='Facebook login'
					/>
				</View>

				<View
					display='flex'
					gap={10}>
					<Button
						wide
						color='background-color'
						grow={1}
						onPress={getMyStoredToken}
						label='Meu token'
					/>
				</View>

				<View
					display='flex'
					gap={10}>
					<Button
						wide
						color='background-color'
						grow={1}
						onPress={executeRefreshToken}
						label='Refresh token'
					/>
				</View>

				<View
					display='flex'
					gap={10}>
					<Button
						wide
						color='background-color'
						grow={1}
						onPress={getLoggedCustomer}
						label='Obter usuário logado'
					/>
				</View>

				<View
					display='flex'
					gap={10}>
					<Button
						wide
						color='background-color'
						grow={1}
						onPress={executeLogout}
						label='Logout'
					/>
				</View>
			</View>
		</Window>
	)
}
