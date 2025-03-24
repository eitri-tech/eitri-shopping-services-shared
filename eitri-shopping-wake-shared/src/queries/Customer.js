export const queryLogin = `
mutation AuthenticatedLogin($input:String!, $pass:String!) {
  data: customerAuthenticatedLogin(input:{input: $input, password: $pass}) {
    isMaster
    token
    type
    validUntil
  }
}`;

export const queryCustomerAccessTokenRenew = `
mutation ($customerAccessToken:String!) {
  data: customerAccessTokenRenew(customerAccessToken:$customerAccessToken) {
    token
    validUntil
  }
}`;

export const querySimpleCustomer = `
query ($customerAccessToken:String!) {
  customer(customerAccessToken:$customerAccessToken) {
    birthDate
    cnpj
    companyName
    cpf
    creationDate
    customerId
    customerName
    customerType
    companyName
    email
  }
}`;

export const queryCustomer = `
query ($customerAccessToken:String!) {
  customer(customerAccessToken:$customerAccessToken) {
    addresses {
      address
      address2
      addressDetails
      addressNumber
      cep
      city
      country
      email
      id
      neighborhood
      phone
      receiverName
      referencePoint
      state
    }
    birthDate
    phoneNumber
    mobilePhoneNumber
    businessPhoneNumber
    customerId
    customerName
    email
    gender
    cpf
    cnpj
    companyName
    creationDate
    customerType
    companyName
    checkingAccountBalance
    checkingAccountHistory {
      date
      historic
      type
      value
    }
    partners { 
      name
      partnerAccessToken
    }
  }
}`;

export const queryCreateCustomer = `
mutation ($input: CustomerCreateInput) {
  data: customerCreate(input: $input) {
    customerId
    customerName
    customerType
  }
}`;

export const querySimpleLogin = `
mutation ($input: String) {
  data: customerSimpleLoginStart(input: $input) {
    customerAccessToken {
      token
      type
      validUntil
    }
    type
    question {
      questionId
      question
      answers {
        id
        value
      }
    }
  }
}`;

export const queryCustomerUpdate = `
mutation ($customerAccessToken: String!, $input: CustomerUpdateInput!) {
  customerUpdate(customerAccessToken: $customerAccessToken, input: $input) {
    customerName
    companyName
    cpf
    cnpj
    email
    phoneNumber
    birthDate
    gender
}
} 
`;

export const queryCustomerCompletePartialRegistration = `
mutation ($customerAccessToken: String!, $input: CustomerSimpleCreateInputGraphInput! ) {
  customerCompletePartialRegistration(input: $input, customerAccessToken: $customerAccessToken) {
    isMaster
    token
    type
    validUntil
  }
}`;

export const queryCustomerPasswordChange = `
mutation ($customerAccessToken: String!, $input: CustomerPasswordChangeInput! ) {
  customerPasswordChange(input: $input, customerAccessToken: $customerAccessToken) {
    isSuccess
  }
}`;

export const queryCreateAddress = `
mutation ($customerAccessToken: String!, $address: CreateCustomerAddressInput! ) {
  customerAddressCreate(address: $address, customerAccessToken: $customerAccessToken) {
    addressDetails
    addressNumber
    cep
    city
    country
    email
    id
    name
    neighborhood
    phone
    state
    street
    referencePoint
  }
}`;

export const queryUpdateAddress = `
mutation ($customerAccessToken: String!, $address: UpdateCustomerAddressInput!, $id: ID! ) {
  customerAddressUpdate(address: $address, customerAccessToken: $customerAccessToken, id: $id) {
    addressDetails
    addressNumber
    cep
    city
    country
    email
    id
    name
    neighborhood
    phone
    state
    street
    referencePoint
  }
}`;

export const queryRemoveAddress = `
mutation ($customerAccessToken: String!, $id: ID! ) {
  customerAddressRemove(customerAccessToken: $customerAccessToken, id: $id) {
    isSuccess
  }
}`;

export const queryGetCustomerWishlist = `query Wishlist($customerAccessToken: String!, $productsIds: [Long]) {
  customer(customerAccessToken: $customerAccessToken){
    wishlist(productsIds: $productsIds){
    	products {
    	  available
        collection
        condition
        display
        freeShipping
        productId
        productName
        productVariantId
        sku
        variantName
        images {
          url
        }
        prices {
          listPrice
          price
          discountPercentage
        }
    	}
    }
  }
}`;

export const queryAddWishlistProduct = `mutation  ($customerAccessToken: String!, $productId: Long! ){
  wishlistAddProduct(customerAccessToken:$customerAccessToken, productId:$productId) {
    productId
    productName
  }
}`;

export const queryRemoveWishlistProduct = `mutation ($customerAccessToken: String!, $productId: Long! ) {
  wishlistRemoveProduct(customerAccessToken:$customerAccessToken, productId: $productId) {
    productId
    productName
  }
}`;

export const queryCustomerOrders = `
query ($customerAccessToken:String!) {
  customer(customerAccessToken:$customerAccessToken) {
    orders {
    items {
      checkingAccount
      checkoutId
      coupon
      date
      deliveryAddress {
        addressNumber
        cep
        city
        complement
        country
        neighboorhood
        receiverName
        referencePoint
        state
        street
      }
      discount
      interestFee
      invoices {
        accessKey
        invoiceCode
        serialDigit
        url
      }
      kits {
        alias
        imageUrl
        kitGroupId
        kitId
        listPrice
        name
        price
        products {
          productVariantId
        }
        quantity
        totalListPrice
      }
      notes {
        date
        note
        user
      }
      orderId
      paymentDate
      payments {
        additionalInfo {
          key
          value
        }
        boleto {
          digitableLine
          paymentLink
        }
        card {
          brand
          maskedNumber
        }
        discount
        fees
        installmentValue
        installments
        message
        paymentOption
        pix {
          qrCode
          qrCodeExpirationDate
          qrCodeUrl
        }
        status
        total
      }
      products {
        productVariantId
        name
        quantity
        salePrice
        sku
        image
        trackings {
          code
          url
        }
      }
      promotions
      shippingFee
      shippings {
        deadline
        deadlineInHours
        deadlineText
        distributionCenterId
        pickUpId
        products {
          distributionCenterId
          price
          productVariantId
          quantity
        }
        promotion
        refConnector
        scheduleFrom
        shippingFee
        shippingName
        shippingTableId
        total
        volume
        weight
      }
      status {
        changeDate
        status
        statusId
      }
      statusHistory {
        changeDate
        status
        statusId
      }
      subscriptions {
        recurringDays
        recurringName
        subscriptionGroupId
        subscriptionId
        subscriptionOrderId
        value
      }
      subtotal
      total
      trackings {
        code
        url
      }
    }
  }
  }
}`;
