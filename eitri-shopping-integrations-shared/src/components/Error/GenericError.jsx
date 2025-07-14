import Eitri from "eitri-bifrost";
import { Text, View, Touchable } from "eitri-luminus";

/**
 * Função de Erro Genérico.
 * 
 * @param {function} onRetryPress Função a ser executada ao pressionar o botão TENTAR NOVAMENTE.
 * 
 */
export default function GenericError(props) {
    const {
        onRetryPress = () => {console.log("onRetryPress not implemented")}
    } = props

    const [appSlug, setAppSlug] = useState('')

    async function getConfigs() {
        try {
            const configs = await Eitri.getConfigs()
            setAppSlug(configs?.miniAppData?.slug)
        } catch (error) {
            console.error("@GenericError.getConfigs", error)
        }
    }
    getConfigs()

    function onCancelPress() {
        Eitri.navigation.backToTop()
    }

    const date = new Date(Date.now());
    const formattedDateHour = new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date)


    return (
        <View
            direction='column'
            alignItems='center'
            height="85vh"
        >
            <View
                direction='column'
                justifyContent='center'
                alignItems='center'
                paddingHorizontal='nano'
                height='100%'>
                <View width='100vw' justifyContent='center' alignItems='center' display="flex" marginBottom="large">
                    <View
                        customColor='#F8FAFC'
                        display="flex"
                        padding='nano'
                        justifyContent='center'
                        alignItems='center'
                        borderRadius='pill'
                        width='30%'
                        height='15vh'
                    >
                        <Text customFontSize='90px' fontWeight='bold' textAlign='center'>
                            !
                        </Text>
                    </View>
                </View>
                <View
                    direction='column'
                    gap={8}
                    justifyContent='center'
                    paddingHorizontal='nano'
                >
                    <Text
                        fontWeight='bold'
                        color='primary-base'
                        fontSize='medium'
                        textAlign='center'>
                        Não foi possível continuar
                    </Text>
                    <Text
                        color='neutral-light'
                        fontSize='body-small'
                        textAlign='center'
                    >
                        Verifique a conexão com a internet do seu dispositivo ou atualizações do aplicativo
                    </Text>
                </View>
            </View>
            <View
                width='100%'
                position='absolute'
                bottom='6%'
                display='flex'
                direction='column'
                justifyContent='center'
                alignItems='center'
            >

                <Touchable
                    borderRadius="small"
                    width="70%"
                    onPress={onRetryPress}
                    opacity="light"
                    customColor="#000"
                    padding="extra-small"
                    justifyContent="center"
                >
                    <Text textAlign='center' color="neutral-100"> TENTAR NOVAMENTE</Text>
                </Touchable>
                <Touchable
                    borderRadius="small"
                    width="70%"
                    onPress={onCancelPress}
                    customColor="#FFF"
                    padding="extra-small"
                    justifyContent="center"
                    borderColor="transparent"
                >
                    <Text textAlign='center' color="title" fontWeight="bold"> CANCELAR</Text>
                </Touchable>
                <Text textAlign='center' marginTop="small">
                    {formattedDateHour}
                </Text>
                <Text textAlign='center'>
                    {appSlug ?? ''}
                </Text>
            </View>
        </View>

    )
}
