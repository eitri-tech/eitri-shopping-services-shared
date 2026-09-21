import { FiShoppingBag, FiShoppingCart, FiCreditCard, FiPackage, FiList, FiExternalLink, FiChevronRight } from 'react-icons/fi'

import { classifyLink } from '../../services/LinkRouter'
import { useChatUI } from './ChatUIContext'
import { accentTextStyle } from './accentColor'

const INTENT_ICONS = {
	product: FiShoppingBag,
	cart: FiShoppingCart,
	checkout: FiCreditCard,
	order: FiPackage,
	orderList: FiList,
	external: FiExternalLink
}

const INTENT_LABEL_KEYS = {
	product: 'linkProduct',
	cart: 'linkCart',
	checkout: 'linkCheckout',
	order: 'linkOrder',
	orderList: 'linkOrderList',
	external: 'linkExternal'
}

function hostnameOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '')
	} catch (_) {
		return ''
	}
}

/**
 * LinkCard
 *
 * Card rico para um link dentro de uma mensagem. A URL é analisada pelo
 * LinkRouter: links de produto/carrinho/checkout/pedido ganham ícone e rótulo
 * contextuais e, ao toque, abrem a tela NATIVA correspondente; os demais abrem
 * no browser in-app.
 *
 * Props: { url, label?, sublabel? }
 *  - label: texto do link markdown, quando houver (senão usa o rótulo do intent)
 */
export default function LinkCard(props) {
	const { url, label, sublabel } = props
	const { config, texts, openLink } = useChatUI()

	if (!url) return null

	const intent = classifyLink(url, { config })
	const Icon = INTENT_ICONS[intent.intent] || FiExternalLink
	const intentLabel = texts[INTENT_LABEL_KEYS[intent.intent]] || texts.linkExternal
	const title = label || intentLabel
	const subtitle = sublabel !== undefined ? sublabel : intent.intent === 'external' ? hostnameOf(url) : intentLabel

	return (
		<View
			onClick={() => openLink(url)}
			className='mt-2 w-full flex flex-row items-center gap-3 rounded-xl bg-white border border-neutral-200 px-3 py-2 shadow-sm'>
			<View className='rounded-full bg-neutral-100 p-2 flex items-center justify-center'>
				<Icon
					size={18}
					style={accentTextStyle(config)}
				/>
			</View>
			<View className='flex-1 flex flex-col'>
				<Text className='text-sm font-semibold text-neutral-900 truncate'>{title}</Text>
				{subtitle && subtitle !== title && (
					<Text className='text-xs text-neutral-500 truncate'>{subtitle}</Text>
				)}
			</View>
			<FiChevronRight
				size={18}
				className='text-neutral-300'
			/>
		</View>
	)
}
