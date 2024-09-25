import { ProductSortKeys } from "./ProductSortKeys"
import { SortDirection } from "./SortDirection"

export class ProductsConnection {
    after = ''
    before = ''
    filters = new ProductExplicitFiltersInput()
    first = 8
    last = 0
    partnerAccessToken = ''
    sortDirection = SortDirection.ASC
    sortKey = ProductSortKeys.SALES
}