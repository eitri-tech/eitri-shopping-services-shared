import WakeCaller from './_helpers/_wakeCaller'

export default class WakeIntelligentSearchService {

	static async products(filter = '', totalPerPage = 2, pointer = '') {
		const _pointer = pointer ? `, after: "${pointer}"` : ''

		const query = `query {
			search(query: "${filter}") {
				products(first: ${totalPerPage} ${_pointer}) {
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

		return response.data.data?.search?.products?.edges || []
	}

}
