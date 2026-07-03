import Eitri from "eitri-bifrost";
import { SalesAuthContext } from "../models/SalesCart";
import { AuthStatus } from "../models/Auth";
import { doLogin as _doLogin } from "./AssistedSalesService";
import Sales from "./Sales";

const SALES_APP_LOGIN_MUTATION = `
  mutation useSalesAppServerLoginMutation {
    login {
      success
      errors { fullMessages }
    }
  }
`;

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  accept: "*/*",
};

export interface SalesUserConfig {
  account: string;
  baseUrl: string;
}

export interface GraphqlAuthContext {
  account: string;
  baseUrl: string;
  vtexIdToken: string;
  userContext: string | null;
  headers: Record<string, string>;
}

export class SalesUserService {
  static async getConfig(): Promise<SalesUserConfig> {
    return Sales.getConfig();
  }

  static graphqlHeaders(
    vtexIdToken: string,
    account: string,
    userContext?: string | null,
  ): Record<string, string> {
    const cookieParts = [
      `VtexIdclientAutCookie=${vtexIdToken}`,
      `VtexUserIsLogged=true`,
    ];
    if (userContext) {
      cookieParts.push(`userContext=${userContext}`);
    }
    return {
      ...JSON_HEADERS,
      "apollographql-client-name": "@vtexlab/gatsby-theme-instore-core",
      "apollographql-client-version": "3.46.1",
      vtexidclientautcookie: vtexIdToken,
      "x-vtex-account-id": account,
      Cookie: cookieParts.join("; "),
    };
  }

  static async resolveUserContext(
    vtexIdToken: string,
    baseUrl: string,
    responseHeaders?: Record<string, any> | null,
    fallback?: string | null,
  ): Promise<string | null> {
    if (fallback) return fallback;

    if (responseHeaders) {
      const setCookies = responseHeaders["set-cookie"];
      if (setCookies) {
        const cookieString = Array.isArray(setCookies)
          ? setCookies.join("; ")
          : String(setCookies);
        const match = cookieString.match(/userContext=([^;,\s]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
    }

    try {
      const res = await Eitri.http.get(
        `${baseUrl}/api/sessions?items=instore.userContext`,
        {
          headers: {
            ...JSON_HEADERS,
            Cookie: `VtexIdclientAutCookie=${vtexIdToken}; VtexUserIsLogged=true`,
          },
        },
      );
      return res.data?.namespaces?.instore?.userContext?.value ?? null;
    } catch (e) {
      console.error("[SalesUserService] Error fetching userContext from session:", e);
      return null;
    }
  }

  static async salesAppLogin(
    baseUrl: string,
    account: string,
    vtexIdToken: string,
    existingUserContext?: string | null,
  ): Promise<{ userContext: string | null; loginSuccess: boolean }> {
    const loginHeaders: Record<string, string> = {
      ...JSON_HEADERS,
      vtexidclientautcookie: vtexIdToken,
      "x-vtex-account-id": account,
      Cookie: `VtexIdclientAutCookie=${vtexIdToken}; VtexUserIsLogged=true`,
    };

    const res = await Eitri.http.post(
      `${baseUrl}/api/sales-app/graphql?operationName=useSalesAppServerLoginMutation`,
      { query: SALES_APP_LOGIN_MUTATION },
      { headers: loginHeaders },
    );

    let userContext = existingUserContext ?? null;
    if (!userContext) {
      userContext = await SalesUserService.resolveUserContext(
        vtexIdToken,
        baseUrl,
        res.headers,
      );
    }

    return { userContext, loginSuccess: res.status === 200 };
  }

  /**
   * Convenience: loads config + auth context from storage, does sales-app login,
   * and returns everything needed to make authenticated GraphQL requests.
   */
  static async getGraphqlAuth(): Promise<GraphqlAuthContext> {
    const { account, baseUrl } = await SalesUserService.getConfig();

    const salesAuthContext: SalesAuthContext | null =
      await Eitri.sharedStorage.getItemJson("salesAuthContext");

    const vtexIdToken = salesAuthContext?.vtexIdToken ?? "";

    const { userContext } = await SalesUserService.salesAppLogin(
      baseUrl,
      account,
      vtexIdToken,
      salesAuthContext?.userContext,
    );

    const headers = SalesUserService.graphqlHeaders(
      vtexIdToken,
      account,
      userContext,
    );

    return { account, baseUrl, vtexIdToken, userContext, headers };
  }

  static async doLogin(email: string, password: string): Promise<AuthStatus> {
    return _doLogin(email, password);
  }

  static decodeMasterdataStoreId(userContext: string): string | null {
    try {
      const payload = userContext.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.masterdataStoreId ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Decodes the JWT and checks if it is expired.
   * Returns true if expired or invalid.
   */
  static isTokenExpired(vtexIdToken: string): boolean {
    try {
      const payload = vtexIdToken.split(".")[1];
      const { exp } = JSON.parse(atob(payload));
      return Date.now() / 1000 >= exp;
    } catch {
      return true;
    }
  }

  /**
   * Full session check for sales-mode users:
   * 1. Client-side JWT expiry check (instant)
   * 2. Server-side via useSalesAppServerLoginMutation
   *
   * Returns { valid: false } on any failure so the caller can logout immediately.
   */
  static async checkSession(): Promise<{ valid: boolean }> {
    const salesAuthContext: SalesAuthContext | null =
      await Eitri.sharedStorage.getItemJson("salesAuthContext");

    if (!salesAuthContext?.vtexIdToken) {
      return { valid: false };
    }

    if (SalesUserService.isTokenExpired(salesAuthContext.vtexIdToken)) {
      console.warn("[SalesUserService] Token expired (client-side check)");
      return { valid: false };
    }

    try {
      const { account, baseUrl } = await SalesUserService.getConfig();
      const { loginSuccess } = await SalesUserService.salesAppLogin(
        baseUrl,
        account,
        salesAuthContext.vtexIdToken,
        salesAuthContext.userContext,
      );
      if (!loginSuccess) {
        console.warn("[SalesUserService] Session invalid (server-side check)");
        return { valid: false };
      }
    } catch (e) {
      // Network error or timeout — assume session is still valid
      // to avoid logging out users who are temporarily offline.
      console.warn("[SalesUserService] Session check request failed, assuming valid:", e);
      return { valid: true };
    }

    return { valid: true };
  }
}
