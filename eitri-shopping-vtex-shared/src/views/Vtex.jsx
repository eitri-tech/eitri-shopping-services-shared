import Eitri from 'eitri-bifrost'

export default function Vtex() {

  const navigateTo = async (path) => {
    Eitri.navigation.navigate({ path })
  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={() => navigateTo('VtexViews/CartMethods')} label='Métodos de carrinho' />
        <Button wide color='background-color' onPress={() => navigateTo('VtexViews/CustomerMethods')} label='Métodos de usuário' />
        <Button wide color='background-color' onPress={() => navigateTo('VtexViews/WishListMethods')} label='Métodos de Wishlist' />
        <Button wide color='background-color' onPress={() => navigateTo('VtexViews/CatalogMethods')} label='Métodos de Catálogo' />
      </View>
    </Window>
  )
}
