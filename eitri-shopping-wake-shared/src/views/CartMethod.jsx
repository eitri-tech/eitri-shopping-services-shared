import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

const cartId = '75a1e20b-e486-4bfd-baea-ff539b39acf8'
export default function CartMethod() {

  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [fullCart, setFullCart] = useState(null)

  useEffect(() => {
    getCart()
  }, [])

  const getCart = async () => {
    try {
      const _cart = await WakeService.cart.getCart()
      console.log('_cart >>', _cart)
      setCart(_cart)
      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  }

  const newCart = async () => {
    const _cart = await WakeService.cart.generateNewCart()
    console.log('_new_cart >>', _cart)
    setCart(_cart)
    setLoading(false)
  }

  const getCartById = async () => {
    const cartId = '75a1e20b-e486-4bfd-baea-ff539b39acf8'
    await WakeService.cart.forceCartId(cartId)
    const _cart = await WakeService.cart.getCart()
    console.log('_cart >>', _cart)
    setLoading(false)
  }

  const addItemCart = async () => {
    setLoading(true)
    //337013, 340789, 341041, 343687
    const _fullCart = await WakeService.cart.addItems([{ productVariantId: 346845, quantity: 1 }])
    setFullCart(_fullCart)
    setLoading(false)
  }

  const removeItemCart = async () => {
    setLoading(true)
    const _fullCart = await WakeService.cart.removeItems([{ productVariantId: 346911, quantity: 1}])
    setFullCart(_fullCart)
    setLoading(false)
  }

  const back = () => {
    Eitri.navigation.back()
  }

  return (
    <Window topInset bottomInset title='CartMethod'>
      <View margin='large'>
        {loading ? (
          <Text marginTop='small'>buscando ...</Text>
        ) : (
          <View>

            <View direction='column'>
              <Text>
                Carrinho no Storage: {cart?.checkoutId}
              </Text>
              <Text>
                Total de Produtos: {cart.quantity || '0'}
              </Text>
            </View>

            {fullCart &&
              <View direction='column'>
                <Text>Checkout value: {fullCart.total || '0'}</Text>
                {fullCart.products?.map((product, idx) => (
                  <Text paddingLeft='small' key={`p_${idx}`}>
                    {product.quantity} {product.name}
                  </Text>
                ))}
              </View>
            }

            <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
              <Button wide color='background-color' onPress={getCart} label={`Get Cart`} />
            </View>

            <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
              <Button wide color='background-color' onPress={newCart} label={`Generate new cart`} />
            </View>

            <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
              <Button wide color='background-color' onPress={addItemCart} label={`addItemCart`} />
            </View>

            <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
              <Button wide color='background-color' onPress={removeItemCart} label={`removeItemCart`} />
            </View>

            <View marginTop='large' direction='column' justifyContent='center' alignItems='center' width='100%'>
              <Button wide backgroundColor='neutral-100' color='neutral-900' onPress={back} label='Voltar' />
            </View>

            <View>

            </View>
          </View>
        )}
      </View>
    </Window>
  )
}
