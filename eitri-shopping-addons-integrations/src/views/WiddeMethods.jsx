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
		<View className='min-h-screen flex flex-col items-center justify-center gap-10 p-8 overflow-y-auto w-full'>
			<Text className='text-xl font-bold'>Métodos Widde</Text>
			<Button
				className='btn-neutral w-full'
				onClick={testWidde}>
				Testar Widde
			</Button>
		</View>
	)
}
