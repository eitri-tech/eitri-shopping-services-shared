export interface StoreLinked {
  id: string
  country: string
  name: string
  tradePolicy: string
  address: string
  number: string
  neighborhood: string
  city: string
  state: string
  postalCode: string
  mobileNumber: string
  pickupPoint: string
  franchiseAccount: string
}

export interface Vendor {
  id: string
  name: string
  user: string
  store: string
  code: string
  store_linked: StoreLinked
}

export interface StoreVendor {
  id: string
  name: string
  store: string
  user: string
  code: string
}
