import { useState } from 'react'
import { FiShoppingCart, FiCheck } from 'react-icons/fi'

import { useChatUI } from './ChatUIContext'
import { accentTextStyle, accentBgStyle } from './accentColor'

/**
 * Formata um preço (número ou string "19.99") com a moeda, espelhando o widget
 * oficial webchat-react (Intl.NumberFormat, narrow symbol).
 */
export function formatPrice(value, currency) {
	if (value === undefined || value === null || value === '') return ''
	let n = value
	if (typeof n === 'string') {
		n = parseFloat(n.replace(/[^0-9.,]/g, '').replace(',', '.'))
	}
	if (isNaN(n)) return String(value)
	try {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: currency || 'BRL',
			currencyDisplay: 'narrowSymbol'
		}).format(n)
	} catch (_) {
		return `R$ ${n.toFixed(2)}`
	}
}

/**
 * ChatProductItem
 *
 * Card de produto renderizado direto dos dados do product_item da Weni (o bot
 * envia name/price/sale_price/currency/image/seller_id/product_url — sem fetch
 * no catálogo). Tocar no card abre o produto NA TELA NATIVA de PDP (via
 * LinkRouter — pela product_url quando o bot manda uma, senão pelo skuId do
 * product_retailer_id); o botão adiciona ao carrinho do app
 * (handler addToCart do contexto — sobrescrevível pelo host via onAddToCart).
 *
 * Props: { item }
 */
export default function ChatProductItem(props) {
	const item = props.item
	const { config, texts, openProduct, addToCart } = useChatUI()
	const [adding, setAdding] = useState(false)
	const [added, setAdded] = useState(false)

	if (!item) return null

	const name = item.name || item.title || ''
	const price = item.price
	const salePrice = item.sale_price
	const currency = item.currency || 'BRL'
	const hasSale = salePrice && String(salePrice) !== String(price)
	const showAddToCart = config.addToCart !== false

	const openProductPage = () => {
		openProduct(item)
	}

	const handleAdd = async event => {
		if (event && typeof event.stopPropagation === 'function') event.stopPropagation()
		if (adding) return
		setAdding(true)
		try {
			await addToCart(item)
			setAdded(true)
			setTimeout(() => setAdded(false), 2500)
		} catch (error) {
			console.log('[ChatProductItem] addToCart error', error)
		} finally {
			setAdding(false)
		}
	}

	return (
		<View
			onClick={openProductPage}
			className='flex-shrink-0 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden'
			style={{ width: 160 }}>
			<View
				className='w-full bg-neutral-100 flex items-center justify-center'
				style={{ height: 130 }}>
				{item.image && (
					<Image
						className='object-contain h-full w-full'
						src={item.image}
					/>
				)}
			</View>
			<View className='p-2 flex flex-col gap-1'>
				<Text className='text-xs font-medium text-neutral-900 truncate'>{name}</Text>
				<View className='flex flex-row items-baseline gap-1 flex-wrap'>
					{hasSale ? (
						<>
							<Text className='text-[10px] text-neutral-400 line-through'>
								{formatPrice(price, currency)}
							</Text>
							<Text
								className='text-sm font-bold'
								style={accentTextStyle(config)}>
								{formatPrice(salePrice, currency)}
							</Text>
						</>
					) : (
						<Text className='text-sm font-bold text-neutral-900'>{formatPrice(price, currency)}</Text>
					)}
				</View>
				{showAddToCart && (
					<View
						onClick={handleAdd}
						className={`mt-1 rounded-full px-2 py-2 flex flex-row items-center justify-center gap-1 ${
							adding ? 'bg-neutral-200' : ''
						}`}
						style={adding ? undefined : accentBgStyle(config)}>
						{added ? (
							<FiCheck
								size={14}
								className='text-white'
							/>
						) : (
							<FiShoppingCart
								size={14}
								className='text-white'
							/>
						)}
						<Text className='text-xs text-white'>{texts.addToCart}</Text>
					</View>
				)}
			</View>
		</View>
	)
}
