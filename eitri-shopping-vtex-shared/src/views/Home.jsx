import App from '../services/App'
import Eitri from 'eitri-bifrost'
import { Vtex } from '../export'

export default function Home() {
	useEffect(() => {
		init()
	}, [])

	const init = async () => {
		await App.tryAutoConfigure({ verbose: false, gaVerbose: true })
		// await Vtex.cart.setOrderFormId('9ee6eb188e0f4ba79839f06e406cda4e')
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
					onPress={() => navigateTo('VtexMethods')}
					label='Métodos Vtex Config'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('CartMethods')}
					label='Métodos de carrinho'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('CustomerMethods')}
					label='Métodos de usuário'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('WishListMethods')}
					label='Métodos de Wishlist'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('CatalogMethods')}
					label='Métodos de Catálogo'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('CheckoutMethods')}
					label='Métodos de Checkout'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('StoreMethods')}
					label='Métodos de loja'
				/>
			</View>
		</Window>
	)
}
