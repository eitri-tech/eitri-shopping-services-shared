import Vtex from "../../services/Vtex";

export default function WishListMethods() {

  const getList = async () => {
    try {
      const res = await Vtex.wishlist.listItems()
      console.log(res)
    } catch (e) {
      console.error(e)
    }

  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={getList} label='Obter minha lista' />
      </View>
    </Window>
  )
}
