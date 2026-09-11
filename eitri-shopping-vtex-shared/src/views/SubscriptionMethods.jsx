import Vtex from '../services/Vtex'

export default function SubscriptionMethods() {
	const [subscriptionId, setSubscriptionId] = useState('')
	const [itemId, setItemId] = useState('')
	const [cycleId, setCycleId] = useState('')
	const [skuId, setSkuId] = useState('')

	const run = async (label, executor) => {
		try {
			const res = await executor()
			console.log(label, res)
			return res
		} catch (e) {
			console.error(label, e?.response?.data ?? e)
		}
	}

	const listSubscriptions = async () => {
		const res = await run('listSubscriptions', () => Vtex.subscription.listSubscriptions())
		if (res?.[0]) {
			setSubscriptionId(res[0].id)
			setItemId(res[0].items?.[0]?.id ?? '')
			setCycleId(res[0].lastCycleId ?? '')
		}
	}

	const listCycles = async () => {
		const res = await run('listCycles', () => Vtex.subscription.listCycles({ subscriptionId }))
		if (res?.[0]) setCycleId(res[0].id)
	}

	const updateStatus = status =>
		run(`updateSubscription ${status}`, () => Vtex.subscription.updateSubscription(subscriptionId, { status }))

	const METHODS = [
		{ label: 'Listar assinaturas', executor: listSubscriptions },
		{
			label: 'Detalhar assinatura',
			executor: () => run('getSubscription', () => Vtex.subscription.getSubscription(subscriptionId))
		},
		{ label: 'Pausar assinatura', executor: () => updateStatus('PAUSED') },
		{ label: 'Reativar assinatura', executor: () => updateStatus('ACTIVE') },
		{ label: 'Cancelar assinatura', executor: () => updateStatus('CANCELED') },
		{
			label: 'Pular próximo ciclo',
			executor: () =>
				run('updateSubscription skip', () =>
					Vtex.subscription.updateSubscription(subscriptionId, { isSkipped: true })
				)
		},
		{
			label: 'Simular assinatura',
			executor: () => run('simulateSubscription', () => Vtex.subscription.simulateSubscription(subscriptionId))
		},
		{
			label: 'Mensagens da assinatura',
			executor: () =>
				run('getConversationMessages', () => Vtex.subscription.getConversationMessages(subscriptionId))
		},
		{
			label: 'Adicionar item (SKU)',
			executor: () => run('addItem', () => Vtex.subscription.addItem(subscriptionId, { skuId, quantity: 1 }))
		},
		{
			label: 'Item: quantidade 2',
			executor: () =>
				run('updateItem', () => Vtex.subscription.updateItem(subscriptionId, itemId, { quantity: 2 }))
		},
		{
			label: 'Remover item',
			executor: () => run('removeItem', () => Vtex.subscription.removeItem(subscriptionId, itemId))
		},
		{ label: 'Listar ciclos', executor: listCycles },
		{ label: 'Detalhar ciclo', executor: () => run('getCycle', () => Vtex.subscription.getCycle(cycleId)) },
		{ label: 'Retentar ciclo', executor: () => run('retryCycle', () => Vtex.subscription.retryCycle(cycleId)) }
	]

	const INPUTS = [
		{ placeholder: 'Subscription ID', value: subscriptionId, onChange: setSubscriptionId },
		{ placeholder: 'Item ID', value: itemId, onChange: setItemId },
		{ placeholder: 'Cycle ID', value: cycleId, onChange: setCycleId },
		{ placeholder: 'SKU ID (adicionar item)', value: skuId, onChange: setSkuId }
	]

	return (
		<Window
			topInset
			bottomInset
			title='Métodos de Subscription'>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				overflow='scroll'
				width='100%'>
				{INPUTS.map(input => (
					<Input
						width='100%'
						placeholder={input.placeholder}
						value={input.value}
						onChange={input.onChange}
					/>
				))}
				{METHODS.map(method => (
					<Button
						wide
						color='background-color'
						onPress={method.executor}
						label={method.label}
					/>
				))}
			</View>
		</Window>
	)
}
