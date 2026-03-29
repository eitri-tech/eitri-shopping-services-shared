import { Button, Window } from 'eitri-luminus'
import { App } from '@/export'
import Eitri from 'eitri-bifrost'
import Shopify from '../services/Shopify'

function Terminal({ log }) {
	if (!log) return null

	return (
		<View
			style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				right: 0,
				maxHeight: '50%',
				backgroundColor: '#1e1e1e',
				borderTopLeftRadius: 12,
				borderTopRightRadius: 12,
				zIndex: 999,
				overflow: 'scroll'
			}}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					padding: 10,
					borderBottomWidth: 1,
					borderBottomColor: '#333',
					gap: 6
				}}>
				<Text style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{log.time}</Text>
				<Text
					style={{
						color: log.type === 'error' ? '#f55' : '#0f0',
						fontFamily: 'monospace',
						fontSize: 11,
						fontWeight: 'bold'
					}}>
					[{log.label}]
				</Text>
			</View>
			<View style={{ padding: 10 }}>
				<Text
					style={{
						color: log.type === 'error' ? '#f55' : '#0f0',
						fontFamily: 'monospace',
						fontSize: 11,
						lineHeight: 16
					}}>
					{log.text}
				</Text>
			</View>
		</View>
	)
}

export default function Home(props) {
	const [log, setLog] = useState(null)

	useEffect(() => {
		App.configure({
			verbose: true,
			appConfigs: {
				statusBarTextColor: 'black'
			}
		})
	}, [])

	const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

	const run = async (label, fn) => {
		setLog({ type: 'info', label, text: 'Executando...', time: now() })
		try {
			const result = await fn()
			const text = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
			setLog({ type: 'success', label, text, time: now() })
			console.log(text)
		} catch (error) {
			setLog({
				type: 'error',
				label,
				text: error?.message || error?.response?.data || String(error),
				time: now()
			})
			console.error(error)
		}
	}

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
					label='Catalogo'
				/>
				<Button
					wide
					color='background-color'
					onPress={() => goToPage('/Cart')}
					label='Carrinho'
				/>

				<Button
					wide
					color='background-color'
					onPress={() =>
						run('Login', async () => {
							Shopify.customer.auth.login()
						})
					}
					label='Login'
				/>

				<Button
					wide
					color='background-color'
					onPress={() => run('Customer', () => Shopify.customer.getCustomer())}
					label='Customer'
				/>

				<Button
					wide
					color='background-color'
					onPress={() => run('Orders', () => Shopify.customer.getOrders())}
					label='Orders'
				/>

				<Button
					wide
					color='background-color'
					onPress={() => run('Order', () => Shopify.customer.getOrder('gid://shopify/Order/6711410753685'))}
					label='Get Order By Id'
				/>
			</View>

			<Terminal log={log} />
		</Window>
	)
}
