import Eitri from "eitri-bifrost";
import WakeService from "../services/WakeService";

let cartId = "c1e3c46b-1872-401d-85e6-b1c8f2c9c464";
const userLogin = {
  login: "leo.csr.silva@gmail.com",
  pass: "123456",
};

export default function CheckoutMethod() {

  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [fullCart, setFullCart] = useState(null)

  const newCart = async () => {
    const _cart = await WakeService.cart.generateNewCart()
    console.log('_cart >>', _cart)
  }

  const login = async () => {
    const result = await WakeService.customer.customerAuthenticatedLogin(
      userLogin.login,
      userLogin.pass
    );
    console.log("create >>", result);
  };

  const getCheckout = async () => {
    let _fullCart = await WakeService.cart.getCheckout()
    console.log('_fullCart >>', _fullCart)
    setFullCart(_fullCart)
    setLoading(false)
  }

  const addItemCart = async () => {
    try {
      console.log('add item cart')
      const _fullCart = await WakeService.cart.addItems([{ productVariantId: 346119, quantity: 1 }])
      console.log('add item cart result >>', _fullCart)
      setFullCart(_fullCart)
    } catch (error) {
      console.error(error)
    }
  }

  const customerAssociate = async () => {
    const response = await WakeService.checkout.checkoutCustomerAssociate()
    console.log('response >>', response)
  }

  const addressAssociate = async () => {
    const response = await WakeService.checkout.checkoutAddressAssociate("eyJFbnRpdHkiOiJDdXN0b21lckFkZHJlc3MiLCJJZCI6NzQ4NDU2fQ==")
    console.log('response >>', response)
  }

  let shippingQuote = ''
  const getShippingQuotes = async () => {
    const response = await WakeService.checkout.shippingQuotes()
    shippingQuote = response.shippingQuotes[0].shippingQuoteId
    console.log('response >>', response)
  }

  const setShippingQuotes = async () => {
    const response = await WakeService.checkout.checkoutSelectShippingQuote(shippingQuote)
    console.log('response >>', response)
  }

  const getPaymentMethods = async () => {
    const response = await WakeService.checkout.paymentMethods()
    console.log('response >>', response)
  }

  const setPaymentMethod = async () => {
    const response = await WakeService.checkout.checkoutSelectPaymentMethod("eyJFbnRpdHkiOiJQYXltZW50TWV0aG9kIiwiSWQiOjkwNDN9")
    console.log('response >>', response)
  }

  const setInstallments = async () => {
    const response = await WakeService.checkout.checkoutSelectInstallment("7c3c7576-9aa3-48c0-8192-955e25500aea", 3)
    console.log('response >>', response)
  }

  const checkoutComplete = async () => {
    //number=5511%206033%203083%201381&name=Wendell%20Lira&month=05&year=2026&expiry=05%2F2026&cvc=261&cpf=17744421086&telefone=21993774635&bandeira=mastercard&finger_print=7859779622c6a446b01587d50c23e13d9f548a46
    const response = await WakeService.checkout.checkoutComplete("")
    console.log('response >>', response)
  }

  const checkoutAddCoupon = async () => {
    const response = await WakeService.checkout.checkoutAddCoupon("PROMOAPP2025")
    console.log('response >>', response)
  }

 const checkoutRemoveCoupon = async () => {
    const response = await WakeService.checkout.checkoutRemoveCoupon()
    console.log('response >>', response)
  }

  const useCashback = async () => {
    try {
      const response = await WakeService.checkout.checkoutUseCheckingAccount(fullCart.checkoutId);
      console.log("response useCashback >>", JSON.stringify(response));
    } catch (e) {
      console.error('useCashback', e);
    }
    await getCheckout()
  };

  const resetCheckout = async () => {
    try {
      const response = await WakeService.checkout.checkoutReset(fullCart.checkoutId);
      console.log("response resetCheckout >>", JSON.stringify(response));
    } catch (e) {
      console.error('resetCheckout', e);
    }
    await getCheckout()
  };

  const back = () => {
    Eitri.navigation.back()
  }

  return (
    <Window topInset bottomInset>
      <View margin='large'>

        <View direction='column'>
          <Text>
            Checkout id: {fullCart?.checkoutId}
          </Text>
          <Text>
            Total de Produtos: {cart.quantity || '0'}
          </Text>
          <Text>
            Credito: {fullCart?.customer?.checkingAccountBalance || '0'}
          </Text>
          <Text>
            Credito associado: {fullCart?.checkingAccountValue || '0'}
          </Text>
        </View>

        {fullCart &&
          <View direction='column'>
            <Text>Subtotal: {fullCart.subtotal || '0'}</Text>
            <Text>Descontos: {fullCart.totalDiscount || '0'}</Text>
            <Text>Total: {fullCart.total || '0'}</Text>
            {fullCart.products?.map((product, idx) => (
              <Text paddingLeft='small' key={`p_${idx}`}>
                {product.quantity} {product.name}
              </Text>
            ))}
          </View>
        }

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={newCart} label={`Cria novo carrinho`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={login} label={`Login`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getCheckout} label={`Get Checkout`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={addItemCart} label={`Add Item to Cart`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={customerAssociate} label={`Associa usuário ao carrinho`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={addressAssociate} label={`Associa endereço ao carrinho`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getShippingQuotes} label={`Opções de frete`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={setShippingQuotes} label={`Selecionar frete`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={getPaymentMethods} label={`Formas de pagamento`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={setPaymentMethod} label={`Setar forma de pagamento`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={setInstallments} label={`Definir parcelas cartão`} />
        </View>

        <View padding='large' direction='column' justifyContent='center' alignItems='center' width='100%' gap={10} >
          <Button wide color='background-color' onPress={checkoutAddCoupon} label={`Adicionar cupom`} />
        </View>

        <View padding="large" direction="column" justifyContent="center" alignItems="center" width="100%" gap={10} >
          <Button wide color="background-color" onPress={useCashback} label={`Usar Crédito da Conta`} />
        </View>

        <View padding="large" direction="column" justifyContent="center" alignItems="center" width="100%" gap={10} >
          <Button wide color="background-color" onPress={resetCheckout} label={`Resetar pagamento`} />
        </View>

        <View marginTop='large' direction='column' justifyContent='center' alignItems='center' width='100%'>
          <Button wide backgroundColor='neutral-100' color='neutral-900' onPress={back} label='Voltar' />
        </View>

      </View>
    </Window>
  )
}
