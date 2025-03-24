import GraphqlService from "./GraphqlService";

export default class CategoryService {
  static async findAll(cursor = "") {
    let _cursor = "";
    if (cursor) {
      _cursor = `, after: "${cursor}"`;
    }

    const query = `query {
			categories(first: 8 ${_cursor}) {
				edges {
					cursor
					node {
						categoryId id name
					}
				}
			}
		}`;

    const response = await GraphqlService.query(query);
    let categories = response.categories?.edges || [];
    return categories;
  }
}
