import { useChatUI } from './ChatUIContext'

// Links markdown [rótulo](url) OU URLs soltas no texto.
const LINK_TOKENIZER = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+)/g

/** Remove pontuação final colada em URLs soltas ("...veja https://x.com/p."). */
function trimTrailingPunctuation(url) {
	return url.replace(/[.,;:!?]+$/, '')
}

/**
 * Tokeniza o texto da mensagem em segmentos de texto e links.
 * @param {string} text
 * @returns {Array<{type:'text', value:string} | {type:'link', url:string, label?:string}>}
 */
export function tokenizeMessageText(text) {
	const segments = []
	let lastIndex = 0
	LINK_TOKENIZER.lastIndex = 0
	let match
	while ((match = LINK_TOKENIZER.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
		}
		if (match[2]) {
			// [rótulo](url)
			segments.push({ type: 'link', url: match[2], label: match[1] })
		} else {
			const cleaned = trimTrailingPunctuation(match[3])
			segments.push({ type: 'link', url: cleaned })
			// devolve a pontuação cortada para o texto seguinte
			const cut = match[3].length - cleaned.length
			if (cut > 0) segments.push({ type: 'text', value: match[3].slice(-cut) })
		}
		lastIndex = match.index + match[0].length
	}
	if (lastIndex < text.length) {
		segments.push({ type: 'text', value: text.slice(lastIndex) })
	}
	return segments
}

/**
 * MessageText
 *
 * Renderiza o texto de uma mensagem com links enriquecidos: URLs e links
 * markdown viram LinkCards (analisados pelo LinkRouter — produto, checkout,
 * pedido etc. abrem a tela nativa). O texto ao redor preserva quebras de linha.
 *
 * Props: { text, isStreaming?, textClassName? }
 */
export default function MessageText(props) {
	const { text, isStreaming, textClassName } = props
	const { components } = useChatUI()

	if (!text) return null

	const Link = components.LinkCard
	const segments = tokenizeMessageText(text)
	const lastTextIndex = segments.map(s => s.type).lastIndexOf('text')
	const cursor = isStreaming ? ' ▍' : ''

	// Sem links: caminho rápido.
	if (segments.length === 1 && segments[0].type === 'text') {
		return <Text className={textClassName || 'text-sm whitespace-pre-wrap'}>{segments[0].value + cursor}</Text>
	}

	return (
		<View className='flex flex-col'>
			{segments.map((segment, index) => {
				if (segment.type === 'link') {
					return (
						<Link
							key={`link-${index}`}
							url={segment.url}
							label={segment.label}
						/>
					)
				}
				const value = segment.value
				// Ignora restos de texto vazios entre links.
				if (!value || !value.trim()) return null
				const withCursor = index === lastTextIndex ? value + cursor : value
				return (
					<Text
						key={`text-${index}`}
						className={textClassName || 'text-sm whitespace-pre-wrap'}>
						{withCursor}
					</Text>
				)
			})}
			{isStreaming && lastTextIndex === -1 && <Text className={textClassName || 'text-sm'}>▍</Text>}
		</View>
	)
}
