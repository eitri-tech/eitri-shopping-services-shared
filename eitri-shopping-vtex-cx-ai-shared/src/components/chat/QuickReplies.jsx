import { useChatUI } from './ChatUIContext'
import { getAccentColor } from './accentColor'

/**
 * QuickReplies
 *
 * Chips tocáveis para os quick_replies da última mensagem do bot. Tocar envia
 * o título como resposta do usuário.
 *
 * Props: { replies, onSelect }
 */
export default function QuickReplies(props) {
	const replies = props.replies
	const onSelect = props.onSelect
	const { config } = useChatUI()

	if (!Array.isArray(replies) || replies.length === 0) return null

	const accent = getAccentColor(config)
	const chipStyle = {
		color: config?.customizeWidget?.quickRepliesFontColor || accent,
		borderColor: config?.customizeWidget?.quickRepliesBorderColor || accent,
		backgroundColor: config?.customizeWidget?.quickRepliesBackgroundColor || undefined
	}

	return (
		<View className='w-full flex flex-wrap gap-2 justify-start mb-3 pl-1'>
			{replies.map((reply, index) => (
				<View
					key={`${reply.payload || reply.title || 'qr'}-${index}`}
					onClick={() => onSelect && onSelect(reply)}
					className='border rounded-full px-4 py-2 bg-white shadow-sm'
					style={chipStyle}>
					<Text
						className='text-sm font-medium'
						style={{ color: chipStyle.color }}>
						{reply.title || reply.text}
					</Text>
				</View>
			))}
		</View>
	)
}
