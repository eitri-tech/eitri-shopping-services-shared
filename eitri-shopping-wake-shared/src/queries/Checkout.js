const checkoutModel = `
    cep
    checkingAccountActive
    checkingAccountValue
    checkoutId
    completed
    coupon
    couponDiscount
    customer {
      checkingAccountBalance
      cnpj
      cpf
      creditLimit
      creditLimitBalance
      customerId
      customerName
      email
      phoneNumber
    }
    customizationValue
    discount
    login
    kits {
      name
    }
    metadata {
      key
      value
    }
    minimumRequirements {
      isMinimumOrderValueReached
      isMinimumProductQuantityReached
      minimumOrderValue
      minimumProductQuantity
      minimumProductQuantityMessage
    }
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
    paymentFees
    selectedPaymentMethod {
      html
      id
      installments {
        adjustment
        number
        total
        value
      }
      paymentMethodId
      scripts
      selectedInstallment {
        adjustment
        number
        total
        value
      }
      suggestedCards {
        brand
        key
        name
        number
      }
    }
    updateDate
    completed
    checkoutId
    url
    products {
      name
      productAttributes {
        name
        value
        type
      }
      listPrice
      price
      ajustedPrice
      productId
      productVariantId
      imageUrl
      quantity
      customization{
        id
        values{
          cost
          name
          value
        }
      }
    }
    selectedAddress {
      addressNumber
      cep
      cep
      city
      complement
      id
      neighborhood
      receiverName
      referencePoint
      state
      street
    }
    shippingFee
    subtotal
    total
    totalDiscount
    selectedShipping {
      deadline
      deadlineInHours
      deliverySchedule {
        date
        endDateTime
        endTime
        startDateTime
        startTime
      }
      name
      shippingQuoteId
      type
      value
    }
`

export const queryCheckoutCustomerAssociate = `
mutation($customerAccessToken: String!, $checkoutId: Uuid!) {
  checkoutCustomerAssociate(
    customerAccessToken: $customerAccessToken
    checkoutId: $checkoutId
  ) {
    ${checkoutModel}
}
}`

export const queryCheckoutAddressAssociate = `
mutation($customerAccessToken: String!, $addressId: ID!, $checkoutId: Uuid!) {
  checkoutAddressAssociate(
    customerAccessToken: $customerAccessToken
    addressId: $addressId
    checkoutId: $checkoutId
  ) {
      ${checkoutModel}
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
    ${checkoutModel}
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
    ${checkoutModel}
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
  ${checkoutModel}
  }
}`

export const queryCheckoutSelectInstallment = `
mutation (
  $checkoutId: Uuid!
  $selectedPaymentMethodId: Uuid!
  $installmentNumber: Int!
) {
  checkoutSelectInstallment(
    checkoutId: $checkoutId
    selectedPaymentMethodId: $selectedPaymentMethodId
    installmentNumber: $installmentNumber
  ) {
  ${checkoutModel}
  }
}`

export const queryCheckoutAddCoupon = `
mutation (
  $checkoutId: Uuid!
  $coupon: String!
  $customerAccessToken: String
) {
  checkoutAddCoupon(
    checkoutId: $checkoutId
    coupon: $coupon
    customerAccessToken: $customerAccessToken
  ) {
    ${checkoutModel}
  }
}`

export const queryCheckoutRemoveCoupon = `
mutation (
  $checkoutId: Uuid!
) {
  checkoutRemoveCoupon(
    checkoutId: $checkoutId
  ) {
    ${checkoutModel}
  }
}`

export const queryAddCheckoutMetadata = `
mutation (
  $checkoutId: Uuid!,
  $metadata: [CheckoutMetadataInput]!
) {
  checkoutAddMetadata(
    checkoutId: $checkoutId
    metadata: $metadata
  ) {
    metadata {
      key value
    }
  }
}`
