import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

export default function ProductsMethod() {

  const productId = 151204
  const categoryId = 14914
  const searchTerm = 'Saia'

  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [singleProduct, setSingleProduct] = useState(null)

  const resetView = () => {
    setProducts([])
    setSingleProduct(null)
  }

  const getProductList = async (cursor) => {
    setLoading(true)
    resetView()
    try {
      const res = await WakeService.product.findAll(cursor)
      setProducts(res)
      console.log(res)
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  const getAllByCategory = async (cursor) => {
    setLoading(true)
    resetView()
    try {
      const res = await WakeService.product.findAllByCategory(categoryId, cursor)
      setProducts(res)
      console.log(res)
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  const findByTerm = async (term, cursor) => {
    setLoading(true)
    resetView()
    try {
      const res = await WakeService.product.findAllByTerm(term, cursor)
      setProducts(res)
      console.log(res)
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  const getProduct = async (productId) => {
    setLoading(true)
    resetView()
    try {
      const res = await WakeService.product.findById(productId)
      setSingleProduct(res)
      console.log(res)
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  const back = () => {
    Eitri.navigation.back()
  }

  return (
    <Window topInset bottomInset>
      {loading ? (
        <Text marginTop='small'>buscando ...</Text>
      ) : (
        <>
          <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
            <Button wide color='background-color' onPress={getProductList} label='Buscar' />
          </View>
          <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
            <Button wide color='background-color' onPress={() => getProduct(productId)} label={`Buscar produto ${productId}`} />
          </View>
          <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
            <Button wide color='background-color' onPress={() => getAllByCategory('')} label={`Buscar na Categoria ${categoryId}`} />
          </View>
          <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
            <Button wide color='background-color' onPress={() => findByTerm(searchTerm, '')} label={`Buscar pelo termo: ${searchTerm}`} />
          </View>

          {products.length > 0 &&
            <View marginTop='large' direction='column' gap={10} width='100%'>
              {products.map((product, idx) => (
                <Text padding='small' key={idx}>{`${product.node.variantName} (${product.node.productId})`}</Text>
              ))}

              <View display='flex' direction='row' justifyContent='between' alignItems='center' marginLeft='large' marginRight='large'>
                <Touchable onPress={() => getProductList(products[products.length - 1].cursor)} >
                  <Text backgroundColor='positive-700' padding='small'>Next</Text>
                </Touchable>
              </View>
            </View>
          }

          {singleProduct?.id &&
            <View>
              <Text>{JSON.stringify(singleProduct)}</Text>
            </View>
          }

          <View marginTop='large' direction='column' justifyContent='center' alignItems='center' width='100%'>
            <Button wide backgroundColor='neutral-100' color='neutral-900' onPress={back} label='Voltar' />
          </View>
        </>
      )}
    </Window>
  )
}
