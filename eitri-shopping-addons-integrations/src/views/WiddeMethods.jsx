import { Widde } from '../export'

export default function WiddeMethods() {

    const testWidde = async () => {
        console.log('[Widde] getConfig =>', Widde.getConfig())

        const productUrl =
            'https://www.hopeoficial.com.br/pijama-longo-em-viscose-com-vivo-contrastante-flora-estampa-listrada-rosa-dust--off-white-0lcl1110/p'

        try {
            const response = await Widde.getStoriesByProductUrl(productUrl)
            console.log('[Widde] getStoriesByProductUrl =>', response)
        } catch (e) {
            console.error('[Widde] erro em getStoriesByProductUrl', e)
        }
    }

    return(
        <Window
                topInset
                bottomInset
                title='Métodos Widde'>
                <View
                    padding='large'
                    direction='column'
                    gap={10}
                    justifyContent='center'
                    alignItems='center'
                    overflow='scroll'
                    width='100%'>
                    <Button
                        wide
                        color='background-color'
                        onPress={testWidde}
                        label='Testar Widde'
                    />
            </View>
        </Window>
    )
}
