/**
 * TypingIndicator
 *
 * Bolha animada de "três pontinhos" enquanto o atendente digita ou a IA pensa.
 *
 * Props: { isTyping, isThinking, thinkingLabel? }
 */
export default function TypingIndicator(props) {
	const isTyping = props.isTyping
	const isThinking = props.isThinking

	if (!isTyping && !isThinking) return null

	return (
		<View className='w-full flex justify-start mb-2'>
			<View className='bg-white border border-gray-200 rounded-2xl px-4 py-3 flex flex-row items-center gap-1'>
				<View
					className='animate-bounce'
					style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#9ca3af' }}
				/>
				<View
					className='animate-bounce'
					style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#9ca3af', animationDelay: '0.15s' }}
				/>
				<View
					className='animate-bounce'
					style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#9ca3af', animationDelay: '0.3s' }}
				/>
			</View>
		</View>
	)
}
