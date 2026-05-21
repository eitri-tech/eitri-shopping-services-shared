import Vtex from '../services/Vtex'

export default function SessionMethods() {
	const createSession = async () => {
		const res = await Vtex.session.createSession()
		console.log('createSession', res)
	}

	const getSession = async () => {
		const res = await Vtex.session.getSession()
		console.log('getSession', res)
	}

	const updateSession = async () => {
		const res = await Vtex.session.updateSession({
			public: {
				postalCode: {
					value: '20541290'
				},
				country: {
					value: 'BRA'
				}
			}
		})
		console.log('updateSession', res)
	}

	const getSegments = async () => {
		const res = await Vtex.session.getSegments()
		console.log('getSegments', res)
	}

	const getSessionToken = async () => {
		const res = await Vtex.session.getSessionToken()
		console.log('getSessionToken', res)
	}

	const METHODS = [
		{ label: 'Criar sessão', executor: createSession },
		{ label: 'Obter sessão', executor: getSession },
		{ label: 'Atualizar sessão', executor: updateSession },
		{ label: 'Obter segmentos', executor: getSegments },
		{ label: 'Obter token de sessão', executor: getSessionToken }
	]

	return (
		<Window
			topInset
			bottomInset
			title='Métodos de Session'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
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
