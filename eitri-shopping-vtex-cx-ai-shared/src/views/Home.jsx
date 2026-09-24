/**
 * Home
 *
 * View de desenvolvimento deste Eitri-App compartilhado — mesma convenção dos
 * outros shared do repo, só para `eitri start` ter uma rota. O pacote não tem
 * UI: os apps que o consomem importam o serviço pelo `export.js`.
 */
export default function Home(props) {
	return (
		<Window
			topInset
			bottomInset>
			<View
				padding='large'
				direction='column'
				gap={8}
				width='100%'>
				<Text>eitri-shopping-vtex-cx-ai-shared</Text>
				<Text>Integração com a API da Weni. Sem UI — consuma via export.js.</Text>
			</View>
		</Window>
	)
}
