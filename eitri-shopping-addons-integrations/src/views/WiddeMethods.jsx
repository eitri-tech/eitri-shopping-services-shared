import { Widde } from '../export'

export default function WiddeMethods() {
	const testWidde = async () => {
		console.log('[Widde] getConfig =>', Widde.getConfig())
		const productUrl =
			'https://www.hopeoficial.com.br/pijama-longo-em-viscose-com-vivo-contrastante-flora-estampa-listrada-rosa-dust--off-white-0lcl1110/p'
		try {
			const response = await Widde.getStoriesByProductUrl(productUrl)
			console.log('[Widde] getStoriesByProductUrl =>', response)
		} catch (e) {
			console.error('[Widde] erro em getStoriesByProductUrl', e)
		}
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
					Métodos Widde
				</Text>
				<Button
					wide
					color='background-color'
					onPress={testWidde}
					label='Testar Widde'
				/>
			</View>
		</Window>
	)
}
