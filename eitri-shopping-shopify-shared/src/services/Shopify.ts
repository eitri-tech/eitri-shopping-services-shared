import { CartService } from './cart/CartService'
import CatalogService from './catalog/CatalogService'
import { AddressService } from './AddressService'
import { CustomerService } from './customer/CustomerService'
import ShopifyCaller from './_helpers/ShopifyCaller'

export default class Shopify {
	static catalog = CatalogService
	static cart = CartService
	static address = AddressService
	static customer = CustomerService
	static http = ShopifyCaller

}
