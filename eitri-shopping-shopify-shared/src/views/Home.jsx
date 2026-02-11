import { Button, Window } from 'eitri-luminus'
import { App } from '@/export'
import Eitri from 'eitri-bifrost'
import Shopify from '../services/Shopify'

export default function Home(props) {
	useEffect(() => {
		App.configure({
			verbose: true,
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

				<Button
					wide
					color='background-color'
					onPress={async () => {
						try {
							const customer = await Shopify.customer.getCustomer()
							console.log('customer', customer)
						} catch (error) {
							console.error(error)
						}
					}}
					label='Customer'
				/>
			</View>
		</Window>
	)
}
