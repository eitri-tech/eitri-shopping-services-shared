export default function queryStringSearchHelper(options) {
  if (!options || Object.keys(options).length === 0) {
    return "";
  }

  let queryString = "";

  if (options.orderBy) {
    queryString += `&O=${options.orderBy}`;
  }

  if (options.from === 0 || options.from) {
    queryString += `&_from=${options.from}`;
  }

  if (options.to === 0 || options.to) {
    queryString += `&_to=${options.to}`;
  }

  console.log("queryStringSearchHelper", queryString);
  return queryString;
}
