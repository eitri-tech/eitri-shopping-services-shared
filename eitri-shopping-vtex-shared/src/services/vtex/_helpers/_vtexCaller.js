import Eitri from "eitri-bifrost";
import Vtex from "../../Vtex";
import vtexCustomerService from "../customer/vtexCustomerService";
import Logger from "../../Logger";

export default class VtexCaller {
  static _mountUrl = (baseUrl, path) => {
    try {
      return new URL(
        `${baseUrl}/${path.startsWith("/") ? path.substring(1) : path}`,
      );
    } catch (error) {
      console.log(
        "Erro ao montar URL",
        `${baseUrl}/${path.startsWith("/") ? path.substring(1) : path}`,
        error,
      );
    }
  };

  static _getHeaders = async () => {
    const headers = {
      "Content-Type": "application/json",
      accept: "application/json",
    };

    const token = await vtexCustomerService.getCustomerToken();

    if (token) {
      const account = Vtex.configs.account;
      headers["VtexIdclientAutCookie"] = token;
      headers["Cookie"] = `VtexIdclientAutCookie_${account}=${token}`;
    }

    if (Vtex.configs.session) {
      if (headers["Cookie"]) {
        headers["Cookie"] +=
          `;vtex_segment=${Vtex.configs?.session?.segmentToken}`;
      } else {
        headers["Cookie"] =
          `vtex_segment=${Vtex.configs?.session?.segmentToken}`;
      }
    }

    return headers;
  };

  static async get(path, options = {}, baseUrl) {
    const _baseUrl = baseUrl || Vtex.configs.api;
    const url = VtexCaller._mountUrl(_baseUrl, path);
    const headers = await VtexCaller._getHeaders();

    Logger.log("===Fazendo Get na API===");
    Logger.log("URL ========>", url.href);
    Logger.log("HEADERS ========>", {
      ...headers,
      ...options.headers,
    });

    const res = await Eitri.http.get(url.href, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    Logger.log("==Resposta do Get Recebida===");

    return res;
  }

  static async post(path, data, options = {}, baseUrl) {
    const _baseUrl = baseUrl || Vtex.configs.api;
    const url = VtexCaller._mountUrl(_baseUrl, path);
    const headers = await VtexCaller._getHeaders();

    Logger.log("===Fazendo Post na API===");
    Logger.log("URL ========>", url.href);
    Logger.log("HEADERS ======>", {
      ...headers,
      ...options.headers,
    });
    Logger.log("BODY =======>", data);

    const res = await Eitri.http.post(url.href, data, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    return res;
  }

  static async patch(path, data, options = {}, baseUrl) {
    const _baseUrl = baseUrl || Vtex.configs.api;
    const url = VtexCaller._mountUrl(_baseUrl, path);
    const headers = await VtexCaller._getHeaders();

    Logger.log("===Fazendo Patch na API===");
    Logger.log("URL ========>", url.href);
    Logger.log("HEADERS ======>", {
      ...headers,
      ...options.headers,
    });
    Logger.log("BODY =======>", data);

    const res = await Eitri.http.patch(url.href, data, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    return res;
  }
}
