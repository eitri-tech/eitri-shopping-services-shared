import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

export default function CustomerMethod() {

  const [loading, setLoading] = useState(true)
  const [fullCart, setFullCart] = useState(null)

  const create = async () => {
    const customer = {
      "address": "Rua Marechal Castelo Branco",
      "addressComplement": "Casa 03",
      "addressNumber": "792",
      "birthDate": "1986-08-07T00:00:00",
      "cep": "74675-540",
      "city": "Goiânia",
      "cpf": "630.110.560-56",
      "customerType": "PERSON",
      "email": "takev76224@angewy.com",
      "fullName": "Alice Agatha da Cunha",
      "gender": "MALE",
      "neighborhood": "Vila dos Subtenentes e Sargentos",
      "newsletter": false,
      "password": "8nBDIY6zB2",
      "passwordConfirmation": "8nBDIY6zB2",
      "primaryPhoneAreaCode": "97",
      "primaryPhoneNumber": "98775-1482",
      "receiverName": "Alice Agatha da Cunha",
      "state": "GO"
    }
    const result = await WakeService.customer.createCustomer(customer)
    console.log('create >>', result)
  }

  const login = async () => {
    const logged = await WakeService.customer.customerAuthenticatedLogin("takev76224@angewy.com", "8nBDIY6zB2")
    console.log('logged >>', logged)
  }

  const getLoggedCustomer = async () => {
    const customer = await WakeService.customer.getCustomer()
    console.log('customer >>', customer)
  }

  const addItemCart = async () => {
    setLoading(true)
    //337013, 340789, 341041, 343687
    console.log('addItemCart')
    const _fullCart = await WakeService.cart.addItems([{ productVariantId: 231030, quantity: 1 }])
    setFullCart(_fullCart)
    setLoading(false)
  }

  const removeItemCart = async () => {
    setLoading(true)
    const _fullCart = await WakeService.cart.removeItems([{ productVariantId: 343687, quantity: 1 }])
    setFullCart(_fullCart)
    setLoading(false)
  }

  const back = () => {
    Eitri.navigation.back()
  }

  return (
    <Window topInset bottomInset>
      <View margin='large'>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={create} label={`Create`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={login} label={`Login`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getLoggedCustomer} label={`Get logged customer`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={addItemCart} label={`addItemCart`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={removeItemCart} label={`removeItemCart`} />
        </View>

        <View marginTop='large' direction='column' justifyContent='center' alignItems='center' width='100%'>
          <Button wide backgroundColor='neutral-100' color='neutral-900' onPress={back} label='Voltar' />
        </View>

      </View>
    </Window>
  )
}
