import Eitri from 'eitri-bifrost'
import App from '../services/App'
import Tracking from '../services/Tracking'
import Logger from '../services/Logger'

export default function GAMethods() {
	const [msgDebug, setMsgDebug] = useState(null)

	const getConfig = async () => {
		setMsgDebug(App.configs)
	}

	const logScreenView = async () => {
		try {
			Logger.log('Usuário testando logScreenView')
			Tracking.ga.logScreenView('GAMethods', 'TestScreen')
			setMsgDebug('Screen view logged successfully')
		} catch (error) {
			setMsgDebug('Error logging screen view: ' + error.message)
		}
	}

	const logEvent = async () => {
		try {
			const eventData = {
				button_clicked: 'test_button',
				timestamp: new Date().toISOString(),
				user_id: 'test_user_123'
			}
			Logger.log('Usuário testando logEvent com dados:', eventData)
			Tracking.ga.logEvent('button_click', eventData)
			setMsgDebug('Event logged successfully: ' + JSON.stringify(eventData))
		} catch (error) {
			setMsgDebug('Error logging event: ' + error.message)
		}
	}

	const logError = async () => {
		try {
			const errorData = {
				error_code: 'TEST_ERROR',
				error_message: 'This is a test error',
				timestamp: new Date().toISOString()
			}
			Tracking.ga.logError('test_error', errorData)
			setMsgDebug('Error logged successfully: ' + JSON.stringify(errorData))
		} catch (error) {
			setMsgDebug('Error logging error: ' + error.message)
		}
	}

	const sendCampaignDetails = async () => {
		try {
			const campaignData = {
				utm_source: 'google',
				utm_medium: 'cpc',
				utm_campaign: 'test_campaign',
				utm_term: 'test_keyword',
				utm_content: 'test_content'
			}
			Tracking.ga.sendCampaignDetails(campaignData)
			setMsgDebug('Campaign details sent successfully: ' + JSON.stringify(campaignData))
		} catch (error) {
			setMsgDebug('Error sending campaign details: ' + error.message)
		}
	}

	const toggleVerbose = async () => {
		App.configs.gaVerbose = !App.configs.gaVerbose
		setMsgDebug('GA Verbose mode: ' + (App.configs.gaVerbose ? 'ON' : 'OFF'))
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
			title='Métodos de Google Analytics'>
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
					onPress={logScreenView}
					label='Log Screen View'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={logEvent}
					label='Log Event'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={logError}
					label='Log Error'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={sendCampaignDetails}
					label='Send Campaign Details'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={toggleVerbose}
					label='Toggle GA Verbose'
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
