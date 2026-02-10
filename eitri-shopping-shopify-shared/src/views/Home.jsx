import { Window } from 'eitri-luminus'
import { App } from '@/export'
import Eitri from 'eitri-bifrost'
import Shopify from '../services/Shopify'

export default function Home(props) {
	useEffect(() => {
		App.configure({
			appConfigs: {
				statusBarTextColor: 'black'
			}
		})
	}, [])

	const goToPage = path => {
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
					onPress={() => goToPage('/Catalog')}
					label='Catálogo'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => goToPage('/Cart')}
					label='Carrrinho'
				/>

				<Button
					wide
					color='background-color'
					onPress={async () => await Shopify.customer.auth.login()}
					label='Login'
				/>
			</View>
		</Window>
	)
}
