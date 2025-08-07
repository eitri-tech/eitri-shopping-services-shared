import Eitri from 'eitri-bifrost'
import App from '../services/App'

export default function AppMethods() {
	const [msgDebug, setMsgDebug] = useState(null)

	const getConfig = async () => {
		setMsgDebug(App.configs)
	}

	const tryAutoConfigure = async () => {
		try {
			const configs = await App.tryAutoConfigure()
			setMsgDebug(configs)
		} catch (error) {
			setMsgDebug('Error on tryAutoConfigure: ' + error.message)
		}
	}

	const toggleVerbose = async () => {
		App.configs.verbose = !App.configs.verbose
		setMsgDebug('Verbose mode: ' + (App.configs.verbose ? 'ON' : 'OFF'))
	}

	const toggleGAVerbose = async () => {
		App.configs.gaVerbose = !App.configs.gaVerbose
		setMsgDebug('GA Verbose mode: ' + (App.configs.gaVerbose ? 'ON' : 'OFF'))
	}

	const testClarityInit = async () => {
		try {
			// Simula uma inicialização do Clarity com um ID de teste
			const clarityId = 'test_clarity_id'
			App.configs.clarityId = clarityId
			setMsgDebug(`Clarity ID configurado: ${clarityId}`)
		} catch (error) {
			setMsgDebug('Error testing Clarity: ' + error.message)
		}
	}

	const copyText = async () => {
		await Eitri.clipboard.setText({
			text: JSON.stringify(msgDebug)
		})
	}

	return (
		<Window
			topInset
			bottomInset
			title='Métodos de Configuração do App'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
				
				<Button
					wide
					color='background-color'
					onPress={getConfig}
					label='Ver Configs'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={tryAutoConfigure}
					label='Try Auto Configure'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={toggleVerbose}
					label='Toggle Verbose'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={toggleGAVerbose}
					label='Toggle GA Verbose'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={testClarityInit}
					label='Test Clarity Init'
				/>
			</View>

			{msgDebug && (
				<View>
					<View
						padding='medium'
						gap={12}
						direction='column'
						overflow='scroll'>
						{typeof msgDebug === 'object' ? (
							<View
								gap={12}
								direction='column'
								overflow='scroll'>
								{Object.keys(msgDebug).map((item, index) => (
									<Text key={item}
										display='flex'
										borderWidth='hairline'
										borderColor='primary-700'>
										{`${item}: ${JSON.stringify(msgDebug[item])}`}
									</Text>
								))}
							</View>
						) : (
							<>
								{typeof msgDebug === 'array' ? (
									<View
										gap={12}
										direction='column'
										overflow='scroll'>
										{msgDebug.map((item, index) => (
											<Text key={JSON.stringify(item)}
												display='flex'
												borderWidth='hairline'
												borderColor='primary-700'>
												{JSON.stringify(item)}
											</Text>
										))}
									</View>
								) : (
									<Text
										display='flex'
										borderWidth='hairline'
										borderColor='primary-700'>
										{msgDebug}
									</Text>
								)}
							</>
						)}
					</View>
					<Touchable
						onPress={copyText}
						width='100%'
						direction='row'
						alignItems='center'
						justifyContent='center'>
						<View
							backgroundColor='neutral-900'
							padding='small'
							display='flex'
							borderWidth='hairline'
							borderRadius='small'
							alignItems='center'
							justifyContent='center'>
							<Text color='neutral-100'>Copiar</Text>
						</View>
					</Touchable>
				</View>
			)}
		</Window>
	)
}
