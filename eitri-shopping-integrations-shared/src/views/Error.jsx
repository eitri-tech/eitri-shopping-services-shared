import Eitri from 'eitri-bifrost'
import GenericError from '../components/Error/GenericError'
export default function Error() {
    const navigateToHome = () => {
        Eitri.navigation.navigate({
            path: 'Home',
        })
    }

    return (
        <Window
            bottomInset
            topInset>
            <GenericError    
                onRetryPress={navigateToHome} 
            />
        </Window>
    )
}
