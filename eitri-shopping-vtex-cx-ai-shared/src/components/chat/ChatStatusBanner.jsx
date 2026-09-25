import { useChatUI } from './ChatUIContext'

/**
 * ChatStatusBanner
 *
 * Faixa fina de estado da conexão (conectando / reconectando / sem conexão),
 * tocável para forçar a reconexão. Some quando conectado.
 *
 * Props: { connectionStatus, isConnected, onReconnect }
 */
export default function ChatStatusBanner(props) {
	const { connectionStatus, isConnected, onReconnect } = props
	const { texts } = useChatUI()

	const label =
		connectionStatus === 'reconnecting'
			? texts.reconnecting
			: connectionStatus === 'connecting'
				? texts.connecting
				: !isConnected
					? texts.disconnected
					: null

	if (!label) return null

	return (
		<View
			onClick={onReconnect}
			className='w-full bg-amber-100 px-4 py-1'>
			<Text className='text-xs text-amber-800 text-center'>
				{label} · {texts.tapToReconnect}
			</Text>
		</View>
	)
}
