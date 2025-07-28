import Vtex from '../services/Vtex'

export default function WishListMethods() {
	const getList = async () => {
		try {
			const res = await Vtex.wishlist.listItems()
			console.log(res)
		} catch (e) {
			console.error(e)
		}
	}

	const addItem = async () => {
		try {
			const products = await Vtex.catalog.legacyParamsSearch('fq=P:%5B0%2520TO%252099999%5D&_from=0&_to=49')
			const product = products[Math.floor(Math.random() * products.length)]
			const sku = product.items[0]
			const res = await Vtex.wishlist.addItem(product.productId, product.productName, sku.itemId)
			console.log(res)
		} catch (e) {
			console.error(e)
		}
	}

	const removeItem = async () => {
		try {
			const itemId = '12'
			const res = await Vtex.wishlist.removeItem(itemId)
			console.log('Item removido:', res)
		} catch (e) {
			console.error('Erro ao remover item:', e)
		}
	}

	const checkItem = async () => {
		try {
			const productId = '2023347'
			const res = await Vtex.wishlist.checkItem(productId)
			console.log('Info do item:', res)
		} catch (e) {
			console.error('Erro ao checar item:', e)
		}
	}

	return (
		<Window
			topInset
			bottomInset>
			<View
				padding='large'
				direction='column'
				gap={10}
				justifyContent='center'
				alignItems='center'
				width='100%'>
				<Button
					wide
					color='background-color'
					onPress={getList}
					label='Obter minha lista'
				/>
				<Button
					wide
					color='background-color'
					onPress={addItem}
					label='Adicionar item na minha lista'
				/>
				<Button
					wide
					color='background-color'
					onPress={removeItem}
					label='Remover item na minha lista'
				/>
				<Button
					wide
					color='background-color'
					onPress={checkItem}
					label='Checar item na minha lista'
				/>
			</View>
		</Window>
	)
}
