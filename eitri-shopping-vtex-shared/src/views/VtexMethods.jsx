import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function VtexMethods() {
	const [msgDebug, setMsgDebug] = useState(null)

  const getConfig = async () => {
		setMsgDebug(Vtex.configs)
  }
  
	const showSession = async () => {
		setMsgDebug(Vtex.configs.session)
  }
  
  const updateSegments = async () => {
    const newSegments = {
      utmCampaign: 'testEitri',
      utm_source: 'eitri-Teste',
      'utm-medium': 'mobile'
    }
    try {
      await Vtex.customer.saveUtmParams(newSegments)
    } catch (e) {
      console.error('Erro ao atualizar segmentos', e)
    }
		
		setMsgDebug(newSegments)
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
			title='Métodos de Configurações Vtex'>
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
					onPress={showSession}
					label='Ver Session e segmentos'
        />
        
        <Button
					wide
					color='background-color'
					onPress={updateSegments}
					label='Salvando novo segmento'
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
