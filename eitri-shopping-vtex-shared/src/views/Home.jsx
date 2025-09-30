import App from '../services/App'
import Eitri from 'eitri-bifrost'
import { Vtex } from '../export'
import CookieService from '@/services/CookieService'

export default function Home() {
	useEffect(() => {
		init()
	}, [])

	const init = async () => {
		await App.tryAutoConfigure({
			// providerInfo: {
			// 	account: 'eitripartnerbr',
			// 	host: 'https://www.eitripartnerbr.com.br',
			// 	faststore: 'eitripartnerbr',
			// 	domain: 'https://www.eitripartnerbr.com.br',
			// 	vtexCmsUrl: 'https://eitripartnerbr.myvtex.com/'
			// },
			verbose: false,
			gaVerbose: false
		})
		await Vtex.session.createSession()
		await Vtex.session.updateSession({
			public: {
				utm_source: {
					value: ''
				},
				utm_campaign: {
					value: 'test'
				}
			}
		})
		console.log('Session:', await CookieService.getAllCookies())
		navigateTo('')

		// await Vtex.cart.setOrderFormId('c9bcc5e093f9457382c5079efd04f3c7')
	}

	const navigateTo = async path => {
		if (!path) return
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
					onPress={() => navigateTo('SessionMethods')}
					label='Métodos de Sessão'
				/>
			</View>
		</Window>
	)
}
