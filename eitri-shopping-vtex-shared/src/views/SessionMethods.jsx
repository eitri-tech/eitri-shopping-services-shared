import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function SessionMethods() {
	const createSession = async () => {
		try {
			const res = await Vtex.session.createSession()
			console.log('Sessao criada', res)
		} catch (e) {
			console.log('Erro', e)
		}
	}

	const getSession = async () => {
		try {
			const res = await Vtex.session.getSession()
			console.log('Sessao:', res)
		} catch (e) {
			console.log('Erro', e)
		}
	}

	return (
		<Window
			topInset
			bottomInset
			title='Métodos de Configurações Vtex'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
				<Button
					wide
					color='background-color'
					onPress={createSession}
					label='Cria sessão'
				/>
				<Button
					wide
					color='background-color'
					onPress={getSession}
					label='Obter sessão'
				/>
			</View>
		</Window>
	)
}
