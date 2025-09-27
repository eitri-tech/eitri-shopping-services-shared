import WakeService from '../services/WakeService'

export default function StoreMethod() {
	const getShopInfo = async () => {
		try {
			const res = await WakeService.store.shop()
			console.log(res)
		} catch (e) {
			console.error(e)
		}
	}

	const getPartnerToken = async () => {
		try {
			const res = await WakeService.store.getPartnerAccessToken()
			console.log(res)
		} catch (e) {
			console.error(e)
		}
	}

	return (
		<Window
			topInset
			bottomInset>
			<View margin='large'>
				<View
					padding='large'
					direction='column'
					justifyContent='center'
					alignItems='center'
					width='100%'
					gap={10}>
					<Button
						wide
						color='background-color'
						onPress={getShopInfo}
						label={`Get Shop`}
					/>
				</View>
				<View
					padding='large'
					direction='column'
					justifyContent='center'
					alignItems='center'
					width='100%'
					gap={10}>
					<Button
						wide
						color='background-color'
						onPress={getPartnerToken}
						label={`Get Partner Token`}
					/>
				</View>
			</View>
		</Window>
	)
}
