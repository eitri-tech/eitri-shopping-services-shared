import HttpService from "./HttpService";

export default class GraphqlService {
  static async query(query, variables = {}) {
    var data = {
      query: query,
      variables: variables,
    };

    const response = await HttpService.post("", data);
    if (response?.data?.errors?.length > 0) {
      throw new Error(JSON.stringify(response?.data?.errors));
    }

    return response.data.data || null;
  }
}
