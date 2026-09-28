import { useChatUI } from './ChatUIContext'

/**
 * ProductCarousel
 *
 * Renderiza uma mensagem product_list da Weni como uma fileira horizontal
 * rolável de cards de produto. Achata os product_items de todas as seções;
 * cada card é renderizado pelo components.ProductItem (sobrescrevível).
 *
 * Props: { productList, header?, footer? }
 */
export default function ProductCarousel(props) {
	const productList = props.productList
	const header = props.header
	const footer = props.footer
	const { components } = useChatUI()

	const sections = Array.isArray(productList?.sections) ? productList.sections : []
	const items = sections.flatMap(section => (Array.isArray(section?.product_items) ? section.product_items : []))

	if (items.length === 0) return null

	const ProductItem = components.ProductItem

	return (
		<View className='w-full flex flex-col gap-2 mb-2'>
			{header && <Text className='text-sm font-bold text-neutral-900'>{header}</Text>}
			{productList?.text && <Text className='text-sm text-neutral-800'>{productList.text}</Text>}

			<View
				className='w-full flex flex-row gap-3 pb-1'
				style={{ overflowX: 'auto' }}>
				{items.map((item, index) => (
					<ProductItem
						key={`${item.product_retailer_id || 'p'}-${index}`}
						item={item}
					/>
				))}
			</View>

			{footer && <Text className='text-xs text-neutral-500'>{footer}</Text>}
		</View>
	)
}
