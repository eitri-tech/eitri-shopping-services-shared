import Vtex from "../../services/Vtex";

export default function CartMethods() {

  const getCart = async () => {
    const cart = await Vtex.cart.getCurrentOrCreateCart()
  }

  const addToCart = async () => {
    const item = {
        "id": "100329818",
        "quantity": 1,
        "seller": "1",
      }
    const cart = await Vtex.cart.addItem({ item, salesChannel: "1" })
  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={getCart} label='Obter ou criar carrinho' />
        <Button wide color='background-color' onPress={addToCart} label='Adicionar ao carrinho' />
      </View>
    </Window>
  )
}
