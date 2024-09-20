import App from "../services/App";
import Eitri from 'eitri-bifrost'

export default function Home() {

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const configs = await App.tryAutoConfigure({ verbose: true })
  }

  const navigateTo = async (path) => {
    Eitri.navigation.navigate({ path })
  }


	return (
    <Window topInset bottomInset>
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button color='background-color' onPress={() => navigateTo('Vtex')} label='VTEX' />
      </View>
    </Window>
  )
}
