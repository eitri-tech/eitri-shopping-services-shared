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
    customerName
    customerType
    companyName
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
