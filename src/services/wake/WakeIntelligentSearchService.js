import WakeCaller from './_helpers/_wakeCaller'

export default class WakeIntelligentSearchService {

	static async products(filter = '', totalPerPage = 2, pointer = '', nextItems = true) {
		let itemsPosition
		
		if (nextItems) {
			const _pointer = pointer ? `, after: "${pointer}"` : ''
			itemsPosition = `first: ${totalPerPage} ${_pointer}`
		} else {
			if (!pointer) throw new Error('Cursor pointer not found')

			const _pointer = pointer ? `, before: "${pointer}"` : ''
			itemsPosition = `last: ${totalPerPage + 1} ${_pointer}`
		}

		const query = `query {
			search(query: "${filter}") {
				products(${itemsPosition}) {
					edges {
						cursor
						node {
							id
							productId
							productName
							productVariantId
						}
					}
				}
			}
		}`

		var data = {
			query: query,
			variables: {}
		}

		const response = await WakeCaller.post('', data)
		let products = response.data.data?.search?.products?.edges || []
		
		if (!nextItems && products.lenght > 0) {
			let _p = products.pop()
		}
		
		return products
	}

}
