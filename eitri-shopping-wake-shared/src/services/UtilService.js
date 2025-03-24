export default class UtilService {
  static parseObjToStringParams(obj) {
    let result = "";
    const keys = Object.keys(obj);

    for (let key of keys) {
      if (typeof obj[key] === "string" && obj[key]) {
        result += `, ${key}:"${obj[key]}"`;
      } else if (typeof obj[key] === "number" && obj[key]) {
        result += `, ${key}:${obj[key]}`;
      }
    }

    return result.substring(2);
  }
}
