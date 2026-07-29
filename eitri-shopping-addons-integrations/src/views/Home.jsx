import Eitri from 'eitri-bifrost'

export default function Home() {

    const navigateTo = async path => {
        Eitri.navigation.navigate({ path })
    }

    return (
        <Window
            topInset
            bottomInset
            title='Addons & Integrações'>
            <View
                padding='large'
                direction='column'
                gap={10}
                justifyContent='center'
                alignItems='center'
                width='100%'>
                <Button
                    wide
                    color='background-color'
                    onPress={() => navigateTo('WiddeMethods')}
                    label='Métodos Widde'
                />
            </View>
        </Window>
    )
}
