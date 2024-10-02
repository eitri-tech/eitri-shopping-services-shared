import Vtex from "../../services/Vtex";

export default function CatalogMethods() {

  const getCart = async () => {
    const cart = await Vtex.cart.getCurrentOrCreateCart()
  }

  const getProduct = async () => {
    const product = await Vtex.catalog.getProductById("2000800")
    console.log(product)
  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={getProduct} label='Obter produto por id' />
      </View>
    </Window>
  )
}
