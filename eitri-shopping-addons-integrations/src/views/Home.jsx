import Eitri from 'eitri-bifrost'

export default function Home() {
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
				gap={16}
				justifyContent='center'
				alignItems='center'
				width='100%'>
				<Text
					fontSize='large'
					fontWeight='bold'>
					Addons & Integrações
				</Text>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('WiddeMethods')}
					label='Métodos Widde'
				/>
			</View>
		</Window>
	)
}
