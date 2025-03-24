import Vtex from "../services/Vtex";

export default function CartMethods() {

  const clearCart = async () => {
    const cart = await Vtex.cart.clearCart()
  }

  const getCart = async () => {
    const cart = await Vtex.cart.getCurrentOrCreateCart()
    console.log(cart)
  }

  const addToCart = async () => {
    const item = {
        "id": "1001",
        "quantity": 1,
        "seller": "1",
      }

    const cart = await Vtex.cart.addItem(item)
  }

  const removeFromCart = async () => {
    const cart = await Vtex.cart.removeItem(1)
  }

  const simulateCart = async () => {
    try {
      const address = await Vtex.checkout.resolveZipCode("20541195")
      const { postalCode, city, state, street, neighborhood, country, geoCoordinates } = address

      const cartSimulationPayload = {
        items: [
          {
            id: "310118597",
            quantity: '1',
            seller: "1"
          }
        ],
        shippingData: {
          selectedAddresses: [
            {
              addressType: '',
              receiverName: '',
              addressId: '',
              isDisposable: true,
              postalCode: postalCode,
              city: city,
              state: state,
              country: country,
              street: street,
              number: null,
              neighborhood: neighborhood,
              complement: null,
              reference: null,
              geoCoordinates: geoCoordinates
            }
          ]
        }
      }
      const cart = await Vtex.cart.simulateCart(cartSimulationPayload, "6")
      console.log(cart)
    } catch (e) {
      console.error("loadProduct: Error", e);
    }

  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={clearCart} label='Limpar carrinho' />
        <Button wide color='background-color' onPress={getCart} label='Obter ou criar carrinho' />
        <Button wide color='background-color' onPress={addToCart} label='Adicionar ao carrinho' />
        <Button wide color='background-color' onPress={removeFromCart} label='Remover do carrinho' />
        <Button wide color='background-color' onPress={simulateCart} label='Simulate cart' />
      </View>
    </Window>
  )
}
