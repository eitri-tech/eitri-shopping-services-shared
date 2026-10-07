import StorageService from '../../StorageService'

const VTEX_CART_KEY = 'vtex_cart_key'

const cartCache = { cart: null }

export async function getStoredOrderFormId() {
	return StorageService.getStorageItem(VTEX_CART_KEY)
}

export default cartCache
