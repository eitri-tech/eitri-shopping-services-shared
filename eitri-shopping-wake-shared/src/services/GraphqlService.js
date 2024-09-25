import HttpService from './HttpService'

export default class GraphqlService {

	static async query(query, variables = {}) {
		var data = {
			query: query,
			variables: variables
		}

		const response = await HttpService.post('', data)
		if (response.errors?.lenght > 0 ) {
			throw new Error(response.errors)
		}
		return response.data.data || null
	}

}
