import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function SessionMethods() {
	const getSession = async () => {
		try {
			const res = await Vtex.session.getSession()
			console.log(res)
		} catch (e) {
			console.error('pd', e)
		}
	}

	const sessionUpdate = async () => {
		try {
			const res = await Vtex.session.updateSession({
				"public": {
					"utm_source": {
						"value": ""
					},
					"utm_campaign": {
						"value": "test"
					}
				}
			})
			console.log(res)
		} catch (e) {
			console.error('pd', e)
		}
	}

	const saveUtmParams = async () => {
		try {
			const res = await Vtex.customer.saveUtmParams({
				utm_source: '',
				utm_campaign: 'test'
			})
			console.log(res)
		} catch (e) {
			console.error('pd', e)
		}
	}

	const METHODS = [
		{
			label: 'Obter sessao',
			executor: getSession
		},
		{
			label: 'Atualizar sessao',
			executor: sessionUpdate
		},
		{
			label: 'Salvar sessão no storage',
			executor: saveUtmParams
		}
	]

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
				{METHODS.map((item, index) => (
					<Button
						key={index}
						wide
						color='background-color'
						onPress={item.executor}
						label={item.label}
					/>
				))}
			</View>
		</Window>
	)
}
