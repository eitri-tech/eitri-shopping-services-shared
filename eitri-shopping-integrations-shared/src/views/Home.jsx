import App from '../services/App'
import Eitri from 'eitri-bifrost'

export default function Home() {
	useEffect(() => {
		init()
	}, [])

	const init = async () => {
		await App.tryAutoConfigure({ verbose: true, gaVerbose: false })
	}

	const navigateTo = async path => {
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
