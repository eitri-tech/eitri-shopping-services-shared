import { Sales } from '../export'

export default function Home() {
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
				<Text
					fontSize='big'
					fontWeight='bold'>
					eitri-shopping-vtex-sales-app
				</Text>
				<Text fontSize='small'>SDK de vendas assistidas (instore) — superfície pública em src/export.ts</Text>
			</View>
		</Window>
	)
}
