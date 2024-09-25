import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

export default function CategoryMethod() {

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])

  const getCategoryList = async (cursor) => {
    setLoading(true)

    try {
      const res = await WakeService.category.findAll(cursor)
      setCategories(res)
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
            <Button wide color='background-color' onPress={getCategoryList} label='Buscar Categorias' />
          </View>

          {categories.length > 0 &&
            <View marginTop='large' direction='column' gap={10} width='100%'>
              {categories.map((category, idx) => (
                <Text padding='small' key={idx}>{`${category.node.name} (${category.node.id}) ${category.node.categoryId}`}</Text>
              ))}

              <View display='flex' direction='row' justifyContent='between' alignItems='center' marginLeft='large' marginRight='large'>
                <Touchable onPress={() => getCategoryList(categories[categories.length - 1].cursor)} >
                  <Text backgroundColor='positive-700' padding='small'>Next</Text>
                </Touchable>
              </View>


            </View>
          }

          <View marginTop='large' direction='column' justifyContent='center' alignItems='center' width='100%'>
            <Button wide backgroundColor='secondary-100' color='background-color' onPress={back} label='Voltar' />
          </View>
        </>
      )}
    </Window>
  )
}
