import WakeService from "../../services/WakeService"

export default function SearchProductsMethod() {

  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])

  const DIRECTION = {
    NEXT: true,
    PREV: false
  }

  const getList = async (pointer, direction = DIRECTION.NEXT) => {
    setLoading(true)
    try {
      const res = await WakeService.search.products('', 2, pointer, direction)
      setProducts(res)
      console.log(res)
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  return (
    <Window topInset bottomInset>
      {loading ? (
        <Text marginTop='small'>buscando ...</Text>
      ) : (
        <>
          <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
            <Button wide color='background-color' onPress={getList} label='Buscar' />
          </View>

          {products.length > 0 &&
            <View marginTop='large' direction='column' gap={10} width='100%'>
              {products.map((product, idx) => (
                <Text padding='small' key={idx}>{`${product.node.productName} (${product.node.productId})`}</Text>
              ))}

              <View display='flex' direction='row' justifyContent='between' alignItems='center' marginLeft='large' marginRight='large'>
                <Touchable onPress={() => getList(products[0].cursor, DIRECTION.PREV)} >
                  <Text backgroundColor='positive-700' padding='small'>--</Text>
                </Touchable>
                <Touchable onPress={() => getList(products[products.length - 1].cursor, DIRECTION.NEXT)} >
                <Text backgroundColor='positive-700' padding='small'>++</Text>
                </Touchable>
              </View>


            </View>
          }
        </>
      )}
    </Window>
  )
}
