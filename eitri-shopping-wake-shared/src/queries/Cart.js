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
`;

export const queryGetCheckout = `
query Checkout($checkoutId: String!, $customerAccessToken: String) {
  data: checkout(checkoutId:$checkoutId, customerAccessToken: $customerAccessToken) {
    ${checkoutModel}
  }
}`;

export const queryAddItem = `
mutation AddToCart($checkoutId:Uuid!, $products:[CheckoutProductItemInput]!) {
  data: checkoutAddProduct(input:{id:$checkoutId, products:$products}) {
    ${checkoutModel}
  }
}`;

export const queryRemoveItem = `
mutation RemoveFromCart($checkoutId:Uuid!, $products:[CheckoutProductItemInput]!) {
  data: checkoutRemoveProduct(input:{id:$checkoutId, products:$products}) {
    ${checkoutModel}
  }
}`;

export const queryCreteCheckout = `
mutation {
  data: createCheckout() {
    ${checkoutModel}
  }
}`;
