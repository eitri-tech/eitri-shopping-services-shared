import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function CMSMethods() {
	const getPagesByContentTypes = async () => {
		try {

			const res = await Vtex.cms.getPagesByContentTypes('americanas', 'home')
			console.log(res)
		} catch (e) {
			console.error('pd', e)
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
					onPress={getPagesByContentTypes}
					label='Obter pagina por tipo de conteudo'
				/>
			</View>
		</Window>
	)
}
