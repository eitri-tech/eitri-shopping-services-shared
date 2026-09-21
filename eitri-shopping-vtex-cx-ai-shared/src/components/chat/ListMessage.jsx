import { FiChevronRight } from 'react-icons/fi'

/**
 * ListMessage
 *
 * Renderiza um list_message do bot como lista vertical de opções tocáveis.
 * Selecionar um item envia seu título como resposta.
 *
 * Props: { listMessage, onSelect }
 */
export default function ListMessage(props) {
	const listMessage = props.listMessage
	const onSelect = props.onSelect

	const items = listMessage?.list_items
	if (!Array.isArray(items) || items.length === 0) return null

	return (
		<View className='w-full flex flex-col gap-2 mb-3'>
			{listMessage.button_text && (
				<Text className='text-xs text-neutral-500 font-medium pl-1'>{listMessage.button_text}</Text>
			)}
			{items.map((item, index) => (
				<View
					key={`${item.id || item.title || 'li'}-${index}`}
					onClick={() => onSelect && onSelect(item)}
					className='flex flex-row items-center gap-2 border border-neutral-200 rounded-xl px-3 py-3 bg-white shadow-sm'>
					<View className='flex-1 flex flex-col'>
						<Text className='text-sm font-medium text-neutral-900'>{item.title}</Text>
						{item.description && <Text className='text-xs text-neutral-500 mt-1'>{item.description}</Text>}
					</View>
					<FiChevronRight
						size={18}
						className='text-neutral-300'
					/>
				</View>
			))}
		</View>
	)
}
