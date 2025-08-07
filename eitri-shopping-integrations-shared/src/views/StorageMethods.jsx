import Eitri from 'eitri-bifrost'
import StorageService from '../services/StorageService'

export default function StorageMethods() {
	const [msgDebug, setMsgDebug] = useState(null)
	const [testKey, setTestKey] = useState('test_key')
	const [testValue, setTestValue] = useState('test_value')

	const setStorageItem = async () => {
		try {
			await StorageService.setStorageItem(testKey, testValue)
			setMsgDebug(`Item salvo: ${testKey} = ${testValue}`)
		} catch (error) {
			setMsgDebug('Erro ao salvar item: ' + error.message)
		}
	}

	const getStorageItem = async () => {
		try {
			const value = await StorageService.getStorageItem(testKey)
			setMsgDebug(`Item recuperado: ${testKey} = ${value || 'null'}`)
		} catch (error) {
			setMsgDebug('Erro ao recuperar item: ' + error.message)
		}
	}

	const setStorageJSON = async () => {
		try {
			const jsonData = {
				name: 'Test Object',
				timestamp: new Date().toISOString(),
				data: [1, 2, 3, 4, 5]
			}
			await StorageService.setStorageJSON(testKey + '_json', jsonData)
			setMsgDebug(`JSON salvo: ${testKey}_json = ${JSON.stringify(jsonData)}`)
		} catch (error) {
			setMsgDebug('Erro ao salvar JSON: ' + error.message)
		}
	}

	const getStorageJSON = async () => {
		try {
			const value = await StorageService.getStorageJSON(testKey + '_json')
			setMsgDebug(`JSON recuperado: ${testKey}_json = ${JSON.stringify(value)}`)
		} catch (error) {
			setMsgDebug('Erro ao recuperar JSON: ' + error.message)
		}
	}

	const removeStorageItem = async () => {
		try {
			await StorageService.removeItem(testKey)
			setMsgDebug(`Item removido: ${testKey}`)
		} catch (error) {
			setMsgDebug('Erro ao remover item: ' + error.message)
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
			title='Métodos de Storage'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
				
				<View width='100%' gap={10}>
					<TextInput
						placeholder='Chave do storage'
						value={testKey}
						onChangeText={setTestKey}
					/>
					<TextInput
						placeholder='Valor do storage'
						value={testValue}
						onChangeText={setTestValue}
					/>
				</View>
				
				<Button
					wide
					color='background-color'
					onPress={setStorageItem}
					label='Salvar Item String'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={getStorageItem}
					label='Recuperar Item String'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={setStorageJSON}
					label='Salvar Item JSON'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={getStorageJSON}
					label='Recuperar Item JSON'
				/>
				
				<Button
					wide
					color='background-color'
					onPress={removeStorageItem}
					label='Remover Item'
				/>
			</View>

			{msgDebug && (
				<View>
					<View
						padding='medium'
						gap={12}
						direction='column'
						overflow='scroll'>
						<Text
							display='flex'
							borderWidth='hairline'
							borderColor='primary-700'
							padding='small'>
							{typeof msgDebug === 'object' ? JSON.stringify(msgDebug) : msgDebug}
						</Text>
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
