import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService";

export default function Home(props) {

    useEffect(() => {
        init()
    }, [])

    const init = async () => {
        const configs = await WakeService.tryAutoConfigure({ verbose: true })
    }

    const navigateTo = async (path) => {
        Eitri.navigation.navigate({ path })
    }

    return (
        <Window topInset bottomInset>
            <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
                <Button wide color='background-color' onPress={() => navigateTo('QueryMethod')} label='Queries' />
            </View>

            <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
                <Button wide color='background-color' onPress={() => navigateTo('ProductsMethod')} label='Busca produtos' />
            </View>
            
            <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
                <Button wide color='background-color' onPress={() => navigateTo('CategoryMethod')} label='Categorias' />
            </View>
        </Window>
    )
}

