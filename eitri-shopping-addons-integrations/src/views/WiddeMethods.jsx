import { Widde } from '../export'

export default function WiddeMethods() {

    const testWidde = async () => {
        const config = await Widde.getWiddeConfig()
        console.log('[Widde] getWiddeConfig =>', config)

        const slug = 'pijama-longo-em-viscose-com-vivo-contrastante-flora-estampa-listrada-rosa-dust--off-white-0lcl1110/p'
        const storeBaseUrl = config.storeBaseUrl || 'https://www.hopeoficial.com.br'
        const media = await Widde.getMidiaByProductSlug(slug, storeBaseUrl)
        console.log('[Widde] getMidiaByProductSlug =>', media)
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
