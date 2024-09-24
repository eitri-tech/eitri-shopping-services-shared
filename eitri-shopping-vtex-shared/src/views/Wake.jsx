import Eitri from 'eitri-bifrost'

export default function Wake() {

  const navigateTo = async (path) => {
    Eitri.navigation.navigate({ path })
  }

  return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={() => navigateTo('WakeViews/SearchProductsMethod')} label='Busca produtos' />
      </View>
    </Window>
  )
}
