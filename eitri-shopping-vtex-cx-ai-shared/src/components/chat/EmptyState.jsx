import { FiMessageCircle } from 'react-icons/fi'

import { useChatUI } from './ChatUIContext'
import { accentTextStyle } from './accentColor'

/**
 * EmptyState
 *
 * Boas-vindas exibidas quando a conversa ainda não tem mensagens.
 */
export default function EmptyState() {
	const { texts, config } = useChatUI()

	return (
		<View className='w-full flex flex-col items-center gap-3 mt-12 px-6'>
			<View className='rounded-full bg-white border border-neutral-200 shadow-sm p-5'>
				<FiMessageCircle
					size={32}
					style={accentTextStyle(config)}
				/>
			</View>
			<Text className='text-base font-bold text-neutral-900 text-center'>{texts.emptyTitle}</Text>
			<Text className='text-sm text-neutral-500 text-center'>{texts.emptySubtitle}</Text>
		</View>
	)
}
