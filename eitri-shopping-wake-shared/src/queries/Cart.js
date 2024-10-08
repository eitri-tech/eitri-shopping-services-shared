export const queryGetCheckout = `
query Checkout($checkoutId: String!) {
  data: checkout(checkoutId:$checkoutId) {
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
    shippingFee
    subtotal
    total
  }
}`

export const queryAddItem = `
mutation AddToCart($checkoutId:Uuid!, $products:[CheckoutProductItemInput]!) {
  data: checkoutAddProduct(input:{id:$checkoutId, products:$products}) {
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
    shippingFee
    subtotal
    total
  }
}`

export const queryRemoveItem = `
mutation RemoveFromCart($checkoutId:Uuid!, $products:[CheckoutProductItemInput]!) {
  data: checkoutRemoveProduct(input:{id:$checkoutId, products:$products}) {
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
    shippingFee
    subtotal
    total
  }
}`