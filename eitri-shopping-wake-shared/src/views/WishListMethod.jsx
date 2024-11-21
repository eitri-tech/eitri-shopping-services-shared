import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

export default function WishListMethod() {

  const [loading, setLoading] = useState(true)
  const [productId, setProductId] = useState(0)

  const back = () => {
    Eitri.navigation.back()
  }

  const getWishList = () => {
    console.log('pegando lista')
  }

  const addWishList = () => {
    console.log('adicionando produto na lista', productId)
  }

  const removeWishList = () => {
    console.log('removendo produto da lista', productId)
  }

  return (
    <Window topInset bottomInset>
      <View margin='large'>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getWishList} label={`GetList`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={addWishList} label={`AddProduct`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={removeWishList} label={`RemoveProduct`} />
        </View>

      </View>
    </Window>
  )
}
