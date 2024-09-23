import WakeService from "../../services/WakeService"

export default function SearchProductsMethod() {

  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])

  const getList = async () => {
    setLoading(true)
    try {
      const res = await WakeService.search.products()
      setProducts(res)
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
            </View>
          }
        </>
      )}
    </Window>
  )
}
