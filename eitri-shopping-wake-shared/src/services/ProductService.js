import GraphqlService from './GraphqlService'

export default class ProductService {

	static defaultProductView = `
		available collection condition display freeShipping id productId productName productVariantId sku variantName
		images(height: 200) { url } 
		prices { listPrice  price discountPercentage } 
		promotions {content title}
		productCategories {active id main name}  `

	static async findAll(cursor = '', sortDirection = 'ASC', sort = 'RELEASE_DATE', filter = '') {

		let _cursor = ''
		if (cursor) {
			_cursor = `, after: "${cursor}"`
		}

		if (filter) {
			if (filter.trim()[0] != ',') filter = ',' + filter.trim()
		}

		const query = `query {
			products(first: 8, sortDirection: ${sortDirection}, sortKey: ${sort}, filters: { available: true, mainVariant: true ${filter}} ${_cursor}) {
				edges {
					cursor
					node {
						${ProductService.defaultProductView}
					}
				}
			}
		}`

		// console.log('query >>>>>>', query)
		const response = await GraphqlService.query(query)
		// console.log('response >>>>>>', response)
		let products = response.products?.edges || []
		return products
	}

	static async findAllByCategory(categoryId, cursor = '', sortDirection = 'ASC', sort = 'RELEASE_DATE') {
		const response = await this.findAll(cursor, sortDirection, sort, `, categoryId: ${categoryId}`)
		return response
	}

	static async findAllByTerm(term = '', cursor = '', sortDirection = 'ASC', sort = 'RELEASE_DATE') {

		let _cursor = ''
		if (cursor) {
			_cursor = `, after: "${cursor}"`
		}

		const query = `query {
			search(query: "${term}") {
				products(first: 8, sortDirection: ${sortDirection}, sortKey: ${sort} ${_cursor}) {
					edges {
						cursor
						node {
							${ProductService.defaultProductView}
						}
					}
				}
			}
		}`

		// console.log('query >>>>>>', query)
		const response = await GraphqlService.query(query)
		let products = response.search?.products?.edges || []
		// console.log('response >>>>>>', response)
		return products
	}

	static async findById(id) {

		const query = `query {
			product(productId: ${id}) {
				${ProductService.defaultProductView}
			}
		}`

		const response = await GraphqlService.query(query)
		let products = response.product || null
		return products
	}

	static async restockAlert(name, email, productVariantId) {
		const query = `mutation ($input: RestockAlertInput!) {
			productRestockAlert(input: $input) {
				productVariantId
				name
				email
				requestDate
			}
		}`
		
		const variables = {
			input: {
				name,
				email,
				productVariantId
			}
		}
		
		const response = await GraphqlService.query(query, variables)
		let products = response.productRestockAlert || null
		return products
	}
	
}
