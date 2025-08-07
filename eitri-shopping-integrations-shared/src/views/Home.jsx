import App from '../services/App'
import Eitri from 'eitri-bifrost'
import Logger from '../services/Logger'

export default function Home() {
	useEffect(() => {
		init()
	}, [])

	const init = async () => {
		console.log('[SHARED] Inicializando App com configurações verbose')
		await App.tryAutoConfigure({ verbose: true, gaVerbose: false })
		console.log('[SHARED] App inicializado com sucesso')
	}

	const navigateTo = async path => {
		Logger.log('Navegando para:', path)
		Eitri.navigation.navigate({ path })
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
					onPress={() => navigateTo('GAMethods')}
					label='Métodos de Google Analytics'
				/>
			</View>
		</Window>
	)
}
