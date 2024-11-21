import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

export default function WishListMethod() {

  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState(0)
  const [wishlistProducts, setWishlistProducts] = useState([])
  const [productToBeAdded, setProductToBeAdded] = useState("")

  const back = () => {
    Eitri.navigation.back()
  }

  const resetView = () => {
    setWishlistProducts([])
  }

  const getWishList = async () => {
    setLoading(true)
    resetView()
    try{
      const res = await WakeService.customer.getWishList()
      setWishlistProducts(res?.customer?.wishlist?.products)
    } catch (e) {
      console.error(e)
    }
    finally {
      setLoading(false)
    }
  }

  const addWishList = async () => {
    if(!productToBeAdded) {
      return null
    }

    setLoading(true)
    try {
      await WakeService.customer.addWishlistProduct(productToBeAdded)
      await getWishList()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const removeWishList = async (productId) => {
    setLoading(true)
    try {
      await WakeService.customer.removeWishlistProduct(productId)
      const filtered = wishlistProducts.filter(item => item.productId !== productId)
      setWishlistProducts(filtered)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Window topInset bottomInset>
      {loading ?
          (<Text marginTop='small'>buscando ...</Text>) :
       (
       <View margin='large'>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getWishList} label={`GetList`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Input type='text' value={productToBeAdded} onChange={value => setProductToBeAdded(value)} placeholder='Id a ser adicionado' />
          <Button wide color='background-color' onPress={addWishList} label={`AddProduct`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={removeWishList} label={`RemoveProduct`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={back} label={`Voltar`} />
        </View>

         { wishlistProducts && wishlistProducts.length > 0 && (
             wishlistProducts.map((product) => (
                 <View display='flex' direction='row' key={product.id} gap={10} >
                   <Text fontSize='medium'>{product.productName}</Text>
                   <Touchable  onPress={() => removeWishList(product.productId)}>
                     <Icon iconKey={'x'} width='20' height='20'/>
                   </Touchable>
                 </View>
             ))
           )}

      </View>)
      }
    </Window>
  )
}
