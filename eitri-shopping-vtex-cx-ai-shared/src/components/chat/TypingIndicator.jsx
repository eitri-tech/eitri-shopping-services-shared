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
		<View
			className='w-full flex mb-2'
			style={{ justifyContent: 'flex-start' }}>
			<View className='bg-white border border-neutral-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex flex-row items-center gap-1'>
				<View
					className='rounded-full bg-neutral-300 animate-bounce'
					style={{ width: 8, height: 8 }}
				/>
				<View
					className='rounded-full bg-neutral-300 animate-bounce'
					style={{ width: 8, height: 8, animationDelay: '0.15s' }}
				/>
				<View
					className='rounded-full bg-neutral-300 animate-bounce'
					style={{ width: 8, height: 8, animationDelay: '0.3s' }}
				/>
				{isThinking && props.thinkingLabel && (
					<Text className='text-xs text-neutral-400 ml-2'>{props.thinkingLabel}</Text>
				)}
			</View>
		</View>
	)
}
