import Eitri from "eitri-bifrost";
import Vtex from "../../Vtex";
import StorageService from "../../StorageService";
import VtexCaller from "../_helpers/_vtexCaller";

export default class VtexCustomerService {
  static STORAGE_USER_TOKEN_KEY = "user_token_key";
  static STORAGE_USER_DATA = "user_data";
  static TOKEN_EXPIRATION_TIME_SEC = 86200;

  static async loginWithEmailAndPassword(email, password) {
    const { account } = Vtex.configs;

    const startLoginRes = await VtexCaller.post(
      "api/vtexid/pub/authentication/startlogin",
      {
        accountName: account,
        scope: account,
        user: email,
      },
      {
        headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
      },
    );

    const setCookieHeader = startLoginRes.headers["set-cookie"];

    let cookieValue = "";
    if (setCookieHeader) {
      cookieValue = setCookieHeader.split(";")[0];
    }

    const loginRes = await VtexCaller.post(
      `api/vtexid/pub/authentication/classic/validate`,
      {
        password: password,
        login: email,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Cookie: cookieValue,
        },
      },
    );

    const { data } = loginRes;
    const { authCookie } = data;
    const { authStatus } = data;

    await VtexCustomerService.setCustomerToken(authCookie.Value);
    VtexCustomerService.setCustomerData("email", email);
    VtexCustomerService.notifyLoginToExposedApis();

    return authStatus;
  }

  static async sendAccessKeyByEmail(email) {
    const { account } = Vtex.configs;

    const startLoginRes = await VtexCaller.post(
      `api/vtexid/pub/authentication/startlogin`,
      {
        accountName: account,
        scope: account,
        user: email,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "*/*",
        },
      },
    );

    const setCookieHeader = startLoginRes.headers["set-cookie"];

    if (setCookieHeader) {
      VtexCustomerService.cookieValue = setCookieHeader.split(";")[0];
    }

    const loginRes = await VtexCaller.post(
      `api/vtexid/pub/authentication/accesskey/send`,
      {
        email: email,
        locale: "pt-BR",
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: VtexCustomerService.cookieValue,
        },
      },
    );

    const { status } = loginRes;

    return status;
  }

  static async loginWithEmailAndAccessKey(email, accessKey) {
    const loginRes = await VtexCaller.post(
      `api/vtexid/pub/authentication/accesskey/validate`,
      {
        accessKey: accessKey,
        login: email,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: VtexCustomerService.cookieValue,
        },
      },
    );

    const { data } = loginRes;
    const { authCookie } = data;
    const { authStatus } = data;

    await VtexCustomerService.setCustomerToken(authCookie.Value);
    VtexCustomerService.setCustomerData("email", email);
    VtexCustomerService.notifyLoginToExposedApis();

    return authStatus;
  }

  static async notifyLoginToExposedApis() {
    try {
      let result = await VtexCustomerService.getCustomerProfile();
      const customerId = result?.data?.profile?.userId;
      if (!customerId) {
        console.log("notifyLoginToExposedApis error", "customerId not found");
        return;
      }
      console.log("notificando login", customerId);
      Eitri.exposedApis.session.notifyLogin({ customerId });
    } catch (e) {
      console.log("notifyLoginToExposedApis error", e);
    }
  }

  static async notifyLogoutToExposedApis() {
    try {
      console.log("notificando logout");
      Eitri.exposedApis.session.notifyLogout();
    } catch (e) {
      console.log("notifyLogoutToExposedApis error", e);
    }
  }

  static async setPassword(email, accessKey, newPassword) {
    const loginRes = await VtexCaller.post(
      `api/vtexid/pub/authentication/classic/setpassword?expireSessions=true`,
      {
        accessKey: accessKey,
        login: email,
        newPassword: newPassword,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
          Cookie: VtexCustomerService.cookieValue,
        },
      },
    );

    const { data } = loginRes;
    const { authCookie } = data;
    const { authStatus } = data;

    await VtexCustomerService.setCustomerToken(authCookie.Value);
    VtexCustomerService.setCustomerData("email", email);

    return authStatus;
  }

  static async listOrders(page, includeProfileLastPurchases = true) {
    const orders = await VtexCaller.get(
      `api/oms/user/orders/?page=${page || 1}&includeProfileLastPurchases=${includeProfileLastPurchases}`,
    );
    return orders.data;
  }

  static async getOrderById(orderId) {
    const orders = await VtexCaller.get(`api/oms/user/orders/${orderId}`);
    return orders.data;
  }

  static async logout() {
    VtexCustomerService.notifyLogoutToExposedApis();
    return StorageService.removeItem(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY,
    );
  }

  static async getCustomerToken() {
    const savedToken = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY,
    );
    if (!savedToken) {
      return null;
    }
    if (
      savedToken.creationTimeStamp +
        VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC <
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return savedToken.token;
  }

  static async getStorageCustomerToken() {
    return await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY,
    );
  }

  static async setCustomerToken(token) {
    const creationTimeStamp = Math.floor(Date.now() / 1000);
    return StorageService.setStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY,
      { token, creationTimeStamp },
    );
  }

  static async isLoggedIn() {
    const savedToken = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_TOKEN_KEY,
    );
    if (!savedToken) {
      return false;
    }
    return (
      savedToken.creationTimeStamp +
        VtexCustomerService.TOKEN_EXPIRATION_TIME_SEC >=
      Math.floor(Date.now() / 1000)
    );
  }

  static async cancelOrder(orderId, payload = {}) {
    const response = await VtexCaller.post(
      `api/checkout/pub/orders/${orderId}/user-cancel-request`,
      payload,
    );
    return response.data;
  }

  static async setCustomerData(key, value) {
    const userData = await StorageService.getStorageJSON(
      VtexCustomerService.STORAGE_USER_DATA,
    );
    if (!userData) {
      return StorageService.setStorageJSON(
        VtexCustomerService.STORAGE_USER_DATA,
        { [key]: value },
      );
    } else {
      const newUserData = { ...userData, [key]: value };
      return StorageService.setStorageJSON(
        VtexCustomerService.STORAGE_USER_DATA,
        newUserData,
      );
    }
  }

  static async retrieveCustomerData() {
    return StorageService.getStorageJSON(VtexCustomerService.STORAGE_USER_DATA);
  }

  static async clearCustomerData() {
    return StorageService.removeItem(VtexCustomerService.STORAGE_USER_DATA);
  }

  static async getCustomerProfile() {
    const token = await VtexCustomerService.getCustomerToken();

    if (!token) {
      throw new Error("User not logged in");
    }

    const body = {
      query:
        'query Profile @context(scope: "private", sender: "vtex.my-account@1.29.0") { profile { userId cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate } }',
    };

    const result = await VtexCaller.post(
      `_v/private/graphql/v1`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      },
      Vtex.configs.host,
    );

    return result?.data;
  }

  static async updateCustomerProfile(profile) {
    const token = await VtexCustomerService.getCustomerToken();

    if (!token) {
      throw new Error("User not logged in");
    }

    const body = {
      query:
        'mutation UpdateProfile($profile: ProfileInput) @context(sender: "vtex.my-account@1.29.0") @runtimeMeta(hash: "ed3962923c6d433ceef1bd1156882fca341d263600e70595af2674fbed0ea549") { updateProfile(fields: $profile) { cacheId firstName lastName birthDate gender homePhone businessPhone document email tradeName corporateName corporateDocument stateRegistration isCorporate __typename } }',
      variables: {
        profile: profile,
      },
    };

    const result = await VtexCaller.post(
      `_v/private/graphql/v1`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      },
      Vtex.configs.host,
    );

    return result?.data;
  }

  static async newsletterSubscribe(email) {}
}
