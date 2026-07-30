import Eitri from 'eitri-bifrost'

export default function Home() {

    const navigateTo = async path => {
        Eitri.navigation.navigate({ path })
    }

return (
	<View className='min-h-screen flex flex-col items-center justify-center gap-10 p-8'>
		<Text className='text-xl font-bold'>Addons & Integrações</Text>
		<Button
			className='btn-neutral w-full'
			onClick={() => navigateTo('WiddeMethods')}>
			Métodos Widde
		</Button>
	</View>
)
}
