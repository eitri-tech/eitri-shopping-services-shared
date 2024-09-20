import Vtex from "../../services/Vtex";

export default function CartMethods() {

  const getCart = async () => {
    const cart = await Vtex.cart.getCurrentOrCreateCart()
  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={getCart} label='getCurrentOrCreateCart' />
      </View>
    </Window>
  )
}
