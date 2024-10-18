export const queryCheckoutCustomerAssociate = `
mutation($customerAccessToken: String!, $checkoutId: Uuid!) {
  checkoutCustomerAssociate(
    customerAccessToken: $customerAccessToken
    checkoutId: $checkoutId
  ) {
  cep
  checkoutId
  customer {
    cnpj
    cpf
    creditLimit
    creditLimitBalance
    customerId
    customerName
    email
    phoneNumber
  }
  selectedAddress {
    addressNumber
    cep
    city
    complement
    id
    neighborhood
    referencePoint
    state
    street
  }
}
}`

export const queryCheckoutAddressAssociate = `
mutation($customerAccessToken: String!, $addressId: ID!, $checkoutId: Uuid!) {
  checkoutAddressAssociate(
    customerAccessToken: $customerAccessToken
    addressId: $addressId
    checkoutId: $checkoutId
  ) {
    cep
    checkoutId
    url
    updateDate
  }
}`

export const queryShippingQuotes = `
query($checkoutId: Uuid!) {
  shippingQuotes(checkoutId: $checkoutId, useSelectedAddress: true) {
    deadline
    name
    products {
      productVariantId
      value
    }
    shippingQuoteId
    type
    value
  }
}`

export const queryCheckoutSelectShippingQuote = `
mutation(
  $checkoutId: Uuid!
  $shippingQuoteId: Uuid!
  $additionalInformation: InStorePickupAdditionalInformationInput
) {
  checkoutSelectShippingQuote(
    checkoutId: $checkoutId
    shippingQuoteId: $shippingQuoteId
    additionalInformation: $additionalInformation
  ) {
  cep
  checkoutId
  shippingFee
  total
  subtotal
  selectedShipping {
    deadline
    name
    shippingQuoteId
    type
    value
    deliverySchedule {
      date
      endDateTime
      endTime
      startDateTime
      startTime
    }
  }
}
}`

export const queryPaymentMethods = `
query($checkoutId: Uuid!) {
  paymentMethods(checkoutId: $checkoutId) {
    id
    name
    imageUrl
  }
}`

export const queryCheckoutSelectPaymentMethod = `
mutation($checkoutId: Uuid!, $paymentMethodId: ID!) {
  checkoutSelectPaymentMethod(
    checkoutId: $checkoutId
    paymentMethodId: $paymentMethodId
  ) {
  checkoutId
  total
  subtotal
  selectedPaymentMethod {
    id
    installments {
      adjustment
      number
      total
      value
    }
    selectedInstallment {
      adjustment
      number
      total
      value
    }
  }
}
}`

export const queryCheckoutComplete = `
mutation (
  $checkoutId: Uuid!
  $paymentData: String!
  $comments: String
  $customerAccessToken: String
) {
  checkoutComplete(
    checkoutId: $checkoutId
    paymentData: $paymentData
    comments: $comments
    customerAccessToken: $customerAccessToken
  ) {
  checkoutId
  completed
  orders {
    adjustments {
      name
      type
      value
    }
    date
    discountValue
    interestValue
    orderId
    orderStatus
    products {
      adjustments {
        name
        additionalInformation
        type
        value
      }
      attributes {
        name
        value
      }
      imageUrl
      name
      productVariantId
      quantity
      value
    }
    shippingValue
    totalValue
    delivery {
      address {
        address
        cep
        city
        complement
        name
        isPickupStore
        neighborhood
        pickupStoreText
      }
      cost
      deliveryTime
      name
    }
    dispatchTimeText
    payment {
      invoice {
        digitableLine
        paymentLink
      }
      name
      pix {
        qrCode
        qrCodeExpirationDate
        qrCodeUrl
      }
    }
  }
}
}`
