import Eitri from 'eitri-bifrost'
import WakeService from "../services/WakeService"

export default function CustomerMethod() {

  const [loading, setLoading] = useState(true)
  const [fullCart, setFullCart] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [logged, setLogged] = useState(false)

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
    const logged = await WakeService.customer.customerAuthenticatedLogin(email, password)
    console.log('logged >>', logged)
    setLogged(logged.token)
  }

  const isLoggedIn = async () => {
    const logged = await WakeService.customer.isLoggedIn()
    console.log('isLoggedIn >>', logged)
    setLogged(logged)
  }

  const logout = async () => {
    await WakeService.customer.logout()
    console.log('logout executado')
    setLogged(false)

  }


  const getLoggedCustomer = async () => {
    const customer = await WakeService.customer.getCustomer()
    console.log('customer >>', customer)
  }
  
  const getSimpleLoggedCustomer = async () => {
    const customer = await WakeService.customer.getSimpleCustomer()
    console.log('Simple customer >>', customer)
  }

  const addAddress = async () => {
    const address = {
      addressNumber: "572",
      addressDetails: "Casa",
      cep: "69445970",
      city: "Anamã",
      country: "BR",
      receiverName: "Wagner",
      neighborhood: "Centro",
      phone: "991226186",
      state: "AM",
      address: "Rua Alvaro Maia"
    }

    // const address = {
    //   "street": "Rua Paula Brito",
    //   "addressNumber": "792",
    //   "addressDetails": "Casa",
    //   "cep": "20541195",
    //   "city": "Rio de Janeiro",
    //   "country": "Brasil",
    //   "neighborhood": "Andarai",
    //   "receiverName": "",
    //   "referencePoint": "",
    //   "state": "RJ"
    // }
    const _fullCart = await WakeService.customer.createAddress(address)
    console.log('result', _fullCart)
  }

  const updateAddress = async () => {
    const address = {
      city: "Anamã"
    }
    const _fullCart = await WakeService.customer.updateAddress('eyJFbnRpdHkiOiJDdXN0b21lckFkZHJlc3MiLCJJZCI6NzQ4NDIzfQ==', address)
    console.log('result', _fullCart)
  }

  const removeAddress = async () => {
    const _fullCart = await WakeService.customer.removeAddress('eyJFbnRpdHkiOiJDdXN0b21lckFkZHJlc3MiLCJJZCI6NzQ4NDIzfQ==')
    console.log('result', _fullCart)
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
          <Input type='text' value={email} onChange={value => setEmail(value)} placeholder='Email' />
          <Input type='text' value={password} onChange={value => setPassword(value)} placeholder='Senha' />
          <Text>{logged ? 'Logado' : 'Não logado'}</Text>
          <Button wide color='background-color' onPress={login} label={`Login`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={isLoggedIn} label={`IsLoggedIn`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={logout} label={`Logout`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getSimpleLoggedCustomer} label={`Get Simple logged customer`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getLoggedCustomer} label={`Get logged customer`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={addAddress} label={`Adiciona endereço`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={updateAddress} label={`Atualiza endereço`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={removeAddress} label={`Remove endereço`} />
        </View>

        <View marginTop='large' direction='column' justifyContent='center' alignItems='center' width='100%'>
          <Button wide backgroundColor='neutral-100' color='neutral-900' onPress={back} label='Voltar' />
        </View>

      </View>
    </Window>
  )
}
