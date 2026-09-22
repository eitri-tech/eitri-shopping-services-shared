import { SizeBay, SizebayService } from '../export'

// Tenant/produto públicos de exemplo, só para exercitar o fluxo (mesmo padrão do WiddeMethods.jsx).
SizebayService.configure({ tenantId: '7897' })

const DEMO_PERMALINK =
	'https://www.oscarcalcados.com.br/bota-montaria-couro-pegada-diana-feminina-preta-1000164665/p'

export default function SizebayDemo() {
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
					Sizebay
				</Text>
				<SizeBay permalink={DEMO_PERMALINK} />
			</View>
		</Window>
	)
}
