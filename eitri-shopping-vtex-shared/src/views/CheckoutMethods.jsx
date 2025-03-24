import Vtex from "../services/Vtex";

export default function CheckoutMethods() {
  const getCart = async () => {
    const cart = await Vtex.cart.getCurrentOrCreateCart();
    console.log(cart);
  };

  const addUser = async () => {
    await Vtex.checkout.addUserData({
      email: "wagnerfq@gmail.com",
      firstName: "Wagner",
      lastName: "Teste",
      documentType: "cpf",
      document: "109372557-50",
      phone: "(11) 91234-5678",
      dob: "1990-05-15",
      isCorporate: false,
      corporateName: "",
      tradeName: "",
      corporateDocument: "",
      corporatePhone: "",
      stateInscription: "",
    });
  };

  const selectShipping = async () => {
    await Vtex.checkout.setLogisticInfo({
      clearAddressIfPostalCodeNotFound: false,
      selectedAddresses: [
        {
          addressType: "residential",
          receiverName: "Wagner Quirino",
          addressId: "8f7f3d3715ec488bbadbb936e6978fc2",
          isDisposable: true,
          postalCode: "20541195",
          city: "Rio de Janeiro",
          state: "RJ",
          country: "BRA",
          street: "Rua Paula Brito",
          number: "600",
          neighborhood: "Andaraí",
          complement: "",
          reference: "",
          geoCoordinates: [-43.25407028198242, -22.9276180267334],
        },
      ],
      logisticsInfo: [
        {
          itemIndex: 0,
          selectedDeliveryChannel: "delivery",
          selectedSla: "NORMAL",
        },
      ],
    });
  };

  const selectPayment = async () => {
    const result = await Vtex.checkout.selectPaymentOption({
      payments: [
        {
          paymentSystem: "17",
          hasDefaultBillingAddress: true,
          isLuhnValid: true,
          installmentsInterestRate: 0,
          accountId: null,
          tokenId: null,
          installments: "1",
          referenceValue: 5200000,
          value: 5200000,
          isRegexValid: true,
        },
      ],
      giftCards: [],
    });

    console.log(result);
  };

  const pay = async () => {
    try {
      const cart = await Vtex.cart.getCurrentOrCreateCart();
      const result = await Vtex.checkout.pay(cart);
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Window topInset bottomInset title="Métodos de checkout">
      <View
        padding="large"
        direction="column"
        gap={10}
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <Button
          wide
          color="background-color"
          onPress={getCart}
          label="Obter carrinho"
        />

        <Button
          wide
          color="background-color"
          onPress={addUser}
          label="Adicionar usuário"
        />

        <Button
          wide
          color="background-color"
          onPress={selectShipping}
          label="Selecionar opção de entrega"
        />

        <Button
          wide
          color="background-color"
          onPress={selectPayment}
          label="Selecionar opção de pagamento"
        />

        <Button wide color="background-color" onPress={pay} label="Pagar" />
      </View>
    </Window>
  );
}
