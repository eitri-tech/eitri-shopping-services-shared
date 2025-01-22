import Vtex from "../services/Vtex";

export default function CheckoutMethods() {

  const selectShipping = async () => {
    await Vtex.checkout.setLogisticInfo({
      "clearAddressIfPostalCodeNotFound": false,
      "selectedAddresses": [
        {
          "addressType": "residential",
          "receiverName": "Wagner Quirino",
          "addressId": "8f7f3d3715ec488bbadbb936e6978fc2",
          "isDisposable": true,
          "postalCode": "20541195",
          "city": "Rio de Janeiro",
          "state": "RJ",
          "country": "BRA",
          "street": "Rua Paula Brito",
          "number": "600",
          "neighborhood": "Andaraí",
          "complement": "",
          "reference": "",
          "geoCoordinates": [
            -43.25407028198242,
            -22.9276180267334
          ]
        }
      ],
      "logisticsInfo": [
        {
          "itemIndex": 0,
          "selectedDeliveryChannel": "delivery",
          "selectedSla": "NORMAL"
        }
      ]
    })
  }

  const selectPayment = async () => {
    await Vtex.checkout.selectPaymentOption({
      "payments":[
        {
          "paymentSystem":125,
          "paymentSystemName":"Pix",
          "group":"instantPaymentPaymentGroup",
          "installmentsValue":37434,
          "value":37434,
          "referenceValue":37434
        }],
      "giftCards":[]
    })
  }


  return (
    <Window topInset bottomInset title="Métodos de checkout">
      <View padding='large' direction='column' gap={10} justifyContent='center' alignItems='center' width='100%'>
        <Button wide color='background-color' onPress={selectShipping} label='Selecionar opção de entrega' />

        <Button wide color='background-color' onPress={selectPayment} label='Selecionar opção de pagamento' />
      </View>
    </Window>
  )
}
