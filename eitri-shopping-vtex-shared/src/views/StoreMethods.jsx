import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function StoreMethods() {
	const getProviders = async () => {
		const res = await Vtex.store.getLoginProviders()
		console.log(res)
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
					onPress={getProviders}
					label='Obter provedores de login'
				/>
			</View>
		</Window>
	)
}
