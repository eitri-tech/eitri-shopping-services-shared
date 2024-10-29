export const queryLogin = `
mutation AuthenticatedLogin($input:String!, $pass:String!) {
  data: customerAuthenticatedLogin(input:{input: $input, password: $pass}) {
    isMaster
    token
    type
    validUntil
  }
}`

export const queryCustomerAccessTokenRenew = `
mutation ($customerAccessToken:String!) {
  data: customerAccessTokenRenew(customerAccessToken:$customerAccessToken) {
    token
    validUntil
  }
}`

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
    businessPhoneNumber
    checkingAccountBalance
    checkingAccountHistory {
      date
      historic
      type
      value
    }
    cnpj
    companyName
    cpf
    creationDate
    customerId
    customerName
    customerType
    companyName
    email
    gender
    partners { 
      name
      partnerAccessToken
    }
  }
}`

export const queryCreateCustomer = `
mutation ($input: CustomerCreateInput) {
  data: customerCreate(input: $input) {
    customerId
    customerName
    customerType
  }
}`

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
}`

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
}`

export const queryRemoveAddress = `
mutation ($customerAccessToken: String!, $id: ID! ) {
  customerAddressRemove(customerAccessToken: $customerAccessToken, id: $id) {
    isSuccess
  }
}`

