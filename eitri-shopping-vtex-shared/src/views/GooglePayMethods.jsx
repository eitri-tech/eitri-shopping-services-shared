import Eitri from 'eitri-bifrost'
import Vtex from '../services/Vtex'

export default function GooglePayMethods() {
	const loadPaymentData = async () => {
		try {
			const paymentData = await Vtex.googlePay.loadPaymentData()
			console.log(paymentData)
		} catch (e) {
			console.error("pd", e)
		}

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
					onPress={loadPaymentData}
					label='Obter dados de pagamento'
				/>
			</View>
		</Window>
	)
}
