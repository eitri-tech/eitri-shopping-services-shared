import App from '../services/App'
import Eitri from 'eitri-bifrost'
import { Vtex } from '../export'

export default function Home() {
	useEffect(() => {
		init()
	}, [])

	const init = async () => {
		// const a = new Date().getTime()
		await App.tryAutoConfigure({
			// providerInfo: {
			// 	account: 'eitripartnerbr',
			// 	host: 'https://www.eitripartnerbr.com.br',
			// 	faststore: 'eitripartnerbr',
			// 	domain: 'https://www.eitripartnerbr.com.br',
			// 	vtexCmsUrl: 'https://eitripartnerbr.myvtex.com/'
			// },
			verbose: true,
			gaVerbose: false
		})

		// await Vtex.customer.saveUtmParams({
		// 	utm_campaign: 'app2'
		// })
		// console.log('[SHARED] End ===> ', new Date().getTime() - a)
		// await Vtex.cart.setOrderFormId('25fa3690032940d6930031caadeb3289')
		await Vtex.cart.getCurrentOrCreateCart()
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
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('GraphqlSearchMethods')}
					label='Métodos de Busca'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('GooglePayMethods')}
					label='Métodos de Google pay'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('CMSMethods')}
					label='Métodos de CMS'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => navigateTo('SessionMethods')}
					label='Métodos de Session'
				/>
			</View>
		</Window>
	)
}
