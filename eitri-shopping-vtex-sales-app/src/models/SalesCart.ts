export interface SalesAuthContext {
  vtexIdToken: string
  userContext?: string | null
}

export interface SkuSeller {
  sellerId: string
  [key: string]: unknown
}

export interface SkuItem {
  itemId: string
  quantity?: number
  sellers?: SkuSeller[]
  [key: string]: unknown
}

export interface OrderItem {
  id: string
  quantity: number
  seller: string
}

export interface OrderFormItem {
  id: string
  name: string
  quantity: number
  price: number
  seller: string
  [key: string]: unknown
}

export interface OrderForm {
  orderFormId: string
  items: OrderFormItem[]
  value: number
  [key: string]: unknown
}

export interface ProviderInfo {
  account: string
  faststore: string
  vtexCmsUrl: string
  host: string
  domain: string
  [key: string]: unknown
}

export interface RemoteConfig {
  providerInfo: ProviderInfo
  [key: string]: unknown
}


export interface CustomerProfile {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  document?: string
  [key: string]: unknown
}

export interface LabeledField<T> {
  label?: string
  data: T
}

export interface ClientProfileOrderItem {
  seller: string
  quantity: number
  description: string
  ean: string
  refId: string
  id: string
  productId: string
  sellingPrice: number
  price: number
  sku: string
}

export interface ClientProfileOrder {
  orderId: string
  creationDate: string
  clientName: string
  items: ClientProfileOrderItem[]
  totalValue: number
  paymentNames: string
  status: string
  statusDescription: string
  marketPlaceOrderId: string | null
  sequence: string
  salesChannel: string
  affiliateId: string
  origin: string
  workflowInErrorState: boolean
  workflowInRetry: boolean
  lastMessageUnread: string | null
  ShippingEstimatedDate: string | null
  ShippingEstimatedDateMax: string | null
  ShippingEstimatedDateMin: string | null
  orderIsComplete: boolean
  listId: string | null
  listType: string | null
  authorizedDate: string | null
  callCenterOperatorName: string | null
  totalItems: number
  currencyCode: string
  hostname: string
  invoiceOutput: string[] | null
  invoiceInput: string[] | null
  lastChange: string
  isAllDelivered: boolean
  isAnyDelivered: boolean
  giftCardProviders: unknown
  orderFormId: string
  paymentApprovedDate: string | null
  readyForHandlingDate: string | null
  deliveryDates: unknown
  customFieldsValues: unknown
  customFields: unknown[]
}

export interface ClientProfileIdentificationUser {
  _id: string
  id: string
  name: string
}

export interface ClientProfileIdentification {
  __typename: string
  _id: string
  id: string
  name: string
  user: ClientProfileIdentificationUser | null
  organization?: Record<string, unknown> | null
}

export interface ClientProfile {
  documentType: LabeledField<string>
  document: LabeledField<string>
  homePhone: LabeledField<string>
  phone: LabeledField<string>
  firstName: LabeledField<string>
  lastName: LabeledField<string>
  addressType: LabeledField<string>
  country: LabeledField<string>
  state: LabeledField<string>
  city: LabeledField<string>
  postalCode: LabeledField<string>
  neighborhood: LabeledField<string>
  street: LabeledField<string>
  number: LabeledField<string>
  lastCart: LabeledField<string>
  lastOrders: LabeledField<ClientProfileOrder[]>
  userId: LabeledField<string>
  id: LabeledField<string>
  addressId: LabeledField<string>
  fullName: LabeledField<string>
  email?: LabeledField<string>
  identification?: ClientProfileIdentification | null
  extraData: Record<string, unknown>
}
