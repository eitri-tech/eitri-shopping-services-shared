import { FiFile, FiVideo, FiMusic } from 'react-icons/fi'

import { useChatUI } from './ChatUIContext'
import { getAccentColor } from './accentColor'

/**
 * ChatMessage
 *
 * Bolha de uma mensagem Weni normalizada. Suporta: texto (com cursor de
 * streaming e links enriquecidos via MessageText/LinkCard), mídia (imagem
 * inline; vídeo/áudio/arquivo como card tocável), caption, cta_message,
 * product_list (carrossel full-width) e conversation_status.
 *
 * Cores: bolha do usuário usa a cor de marca da config (customizeWidget /
 * mainColor), publicável por loja via remoteConfig sem mudar código.
 */
export default function ChatMessage(props) {
	const message = props.message
	const { config, texts, components, openLink } = useChatUI()

	if (!message) return null

	const isOutgoing = message.direction === 'outgoing'
	const isStatus = message.type === 'conversation_status'
	const isStreaming = message.status === 'streaming'
	const isError = message.status === 'error'

	if (isStatus) {
		return (
			<View className='w-full flex justify-center my-3'>
				<View className='bg-neutral-200 rounded-full px-3 py-1'>
					<Text className='text-xs text-neutral-500'>{message.text}</Text>
				</View>
			</View>
		)
	}

	// Lista de produtos: carrossel full-width, fora da bolha estreita.
	if (message.product_list) {
		const Carousel = components.ProductCarousel
		return (
			<View className='w-full mb-3'>
				<Carousel
					productList={message.product_list}
					header={message.header}
					footer={message.footer}
				/>
			</View>
		)
	}

	const MessageTextComponent = components.MessageText
	const Link = components.LinkCard

	const alignment = isOutgoing ? 'justify-end' : 'justify-start'
	const bubbleShape = isOutgoing ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'
	const bubbleColor = isOutgoing ? 'text-white' : 'bg-white text-neutral-900 border border-neutral-200 shadow-sm'
	// Cor da marca (por loja, via remoteConfig['weniChat'].customizeWidget).
	const bubbleStyle = isOutgoing
		? { backgroundColor: config?.customizeWidget?.userMessageBubbleColor || getAccentColor(config) }
		: undefined

	const isImage = message.type === 'image' || (message.media && /^data:image\//.test(message.media))
	const mediaCardIcon =
		message.type === 'video' ? (
			<FiVideo size={20} />
		) : message.type === 'audio' ? (
			<FiMusic size={20} />
		) : (
			<FiFile size={20} />
		)
	const mediaCardLabel =
		message.type === 'video' ? texts.openVideo : message.type === 'audio' ? texts.openAudio : texts.openFile

	return (
		<View className={`w-full flex ${alignment} mb-2`}>
			<View
				className={`max-w-[85%] px-3 py-2 ${bubbleShape} ${bubbleColor} ${isError ? 'opacity-60' : ''}`}
				style={bubbleStyle}>
				{message.media && isImage && (
					<View className='mb-1'>
						<Image
							className='rounded-lg max-w-full'
							src={message.media}
						/>
					</View>
				)}

				{message.media && !isImage && (
					<View
						onClick={() => openLink(message.media)}
						className='flex flex-row items-center gap-2 mb-1'>
						{mediaCardIcon}
						<Text className='text-sm font-medium underline'>{mediaCardLabel}</Text>
					</View>
				)}

				{message.text && (
					<MessageTextComponent
						text={message.text}
						isStreaming={isStreaming}
					/>
				)}

				{message.caption && <Text className='text-xs mt-1 opacity-80'>{message.caption}</Text>}

				{message.cta_message?.url && (
					<Link
						url={message.cta_message.url}
						label={message.cta_message.display_text}
					/>
				)}

				{isError && <Text className='text-xs mt-1 opacity-80'>{texts.sendFailed}</Text>}
			</View>
		</View>
	)
}
