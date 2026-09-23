import Eitri from 'eitri-bifrost'
import { FiChevronLeft, FiChevronDown, FiEdit } from 'react-icons/fi'

import ChatAvatar from './ChatAvatar'
import { useChatUI } from './ChatUIContext'
import { accentTextStyle } from './accentColor'

/**
 * ChatHeader
 *
 * Cabeçalho da experiência de atendimento: voltar (opcional), avatar do
 * assistente, título + status de presença (bolinha verde quando conectado) e
 * ação de "Nova conversa".
 *
 * Props: { connectionStatus, onNewConversation, onBack?, showBack?, topInset?, backIcon? }
 *  - onBack ausente + showBack=true -> Eitri.navigation.back()
 *  - topInset=false: não reserva o espaço da status bar (uso embutido, ex.:
 *    sheet sobre outra tela, que já não começa no topo do device)
 *  - backIcon='down': seta pra baixo em vez de esquerda (uso como "fechar"
 *    de um painel, em vez de "voltar" de navegação)
 */
export default function ChatHeader(props) {
	const { connectionStatus, onNewConversation, onBack, showBack = true, topInset = true, backIcon = 'left' } = props
	const BackIcon = backIcon === 'down' ? FiChevronDown : FiChevronLeft
	const { config, texts } = useChatUI()

	const isConnected = connectionStatus === 'connected'
	const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
	const statusLabel = isConnected ? texts.headerOnline : isConnecting ? texts.headerConnecting : texts.headerOffline

	const handleBack = () => {
		if (typeof onBack === 'function') return onBack()
		try {
			Eitri.navigation.back()
		} catch (_) {
			/* noop */
		}
	}

	const headerStyle = config?.customizeWidget?.headerBackgroundColor
		? { backgroundColor: config.customizeWidget.headerBackgroundColor }
		: undefined

	const actionColor = config?.customizeWidget?.headerActionColor

	return (
		<View
			className='w-full bg-white border-b border-neutral-200'
			style={headerStyle}>
			{/* Consome o safe-area da status bar (mesma técnica do
			    HeaderContentWrapper: View com topInset='auto'), com o MESMO fundo
			    do header para parecer uma peça só. Só faz sentido em tela cheia —
			    quando embutido (ex.: sheet), topInset=false remove esse espaço. */}
			{topInset && (
				<View
					topInset={'auto'}
					className='w-full'
				/>
			)}
			<View className='w-full flex flex-row items-center gap-2 px-2 py-3'>
			{showBack && (
				<View
					onClick={handleBack}
					className='p-2'>
					<BackIcon
						size={24}
						className='text-neutral-900'
					/>
				</View>
			)}

			{/* avatar do assistente */}
			<View className='relative'>
				<ChatAvatar
					size={36}
					iconSize={18}
				/>
				<View
					className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
						isConnected ? 'bg-green-500' : isConnecting ? 'bg-amber-400' : 'bg-neutral-200'
					}`}
				/>
			</View>

			<View className='flex-1 flex flex-col ml-1'>
				<Text className='text-base font-bold text-neutral-900'>{texts.header || config.title}</Text>
				<Text className='text-xs text-neutral-500'>{config.subtitle || statusLabel}</Text>
			</View>

			{onNewConversation && (
				<View
					onClick={onNewConversation}
					className='flex flex-row items-center gap-1 p-2'>
					<FiEdit
						size={18}
						style={actionColor ? { color: actionColor } : accentTextStyle(config)}
					/>
					<Text className='text-xs font-medium text-neutral-900'>{texts.newConversation}</Text>
				</View>
			)}
			</View>
		</View>
	)
}
