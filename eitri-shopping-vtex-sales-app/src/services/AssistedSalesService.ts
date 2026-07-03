import { Vtex } from "eitri-shopping-vtex-shared";
import { createEitriLink } from "@eitri-helper/apollo";
import {
  gql,
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import { getVendorAndStore } from "../queries/loadVendorStore.gql";
import { getVendorsByStore } from "../queries/getVendorsByStore.gql";
import Eitri from "eitri-bifrost";
import { AuthStatus, LoginData } from "../models/Auth";
import { Vendor, StoreLinked, StoreVendor } from "../models/Vendor";
import Sales from "./Sales";

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

export const doLogin = async (
  email: string,
  password: string,
): Promise<AuthStatus> => {
  return await loginSalesAppWithEmailAndPassword(email, password);
};

async function _startSalesAppLogin(
  baseUrl: string,
): Promise<string | undefined> {
  try {
    const startLoginRes = await Eitri.http.get(
      `${baseUrl}/api/vtexid/pub/authentication/start?vtex-id-ui-version=instore`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      },
    );

    const vssCookie = extractCookies(startLoginRes, "_vss");
    if (vssCookie) {
      Vtex.customer.cookieValue = vssCookie;
    }
    return startLoginRes.data.authenticationToken as string;
  } catch (e) {
    console.error("Error starting login process", e);
  }
}

async function loginSalesAppWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AuthStatus> {
  console.warn("Logging in with email and password", email);
  const { account, baseUrl } = await Sales.getConfig();
  const authenticationToken = await _startSalesAppLogin(baseUrl);

  const loginRes = await Eitri.http.post(
    `${baseUrl}/api/vtexid/pub/authentication/classic/validate`,
    {
      password,
      login: email,
      authenticationToken,
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
        accept: "*/*",
        Cookie: `_vss=${Vtex.customer.cookieValue}`,
      },
    },
  );

  const refreshToken = extractCookies(loginRes, "vid_rt");
  const vtexIdToken = extractCookies(loginRes, "VtexIdclientAutCookie") ?? "";
  const { data }: { data: LoginData } = loginRes;
  const { authStatus } = data;

  console.log("Login response received", { data, refreshToken });

  if (authStatus === "Success") {
    await Vtex.customer._processPostLogin(data, refreshToken);
    apolloClient = await startApolloClient(account, vtexIdToken);
    const vendorData = await loadVendorData();
    await Eitri.sharedStorage.setItemJson("vendorData", vendorData);
    const userContextCookie = _getCookieValue("userContext");
    console.log(
      "[AssistedSalesService] userContext cookie:",
      userContextCookie ? "found" : "not found",
    );
    await Eitri.sharedStorage.setItemJson("salesAuthContext", {
      vtexIdToken,
      userContext: userContextCookie,
    });
    Eitri.eventBus.publish({
      channel: "VENDOR_DATA_LOGGED",
      data: vendorData,
      broadcast: true,
    });
    return "Success";
  }

  return authStatus;
}

export const loadVendorData = async (): Promise<Vendor> => {
  try {
    console.warn("Loading vendor data");
    const client = await getApolloClient();

    const { data } = await client.query({
      query: gql(getVendorAndStore),
      variables: {},
    });

    const vendor = data["getVendorAndStore"] as Vendor & {
      __typename: string;
      store_linked: StoreLinked & { __typename: string };
    };
    const { __typename, store_linked, ...vendorFields } = vendor;
    const { __typename: _storeTypename, ...storeFields } = store_linked;

    const result: Vendor = { ...vendorFields, store_linked: storeFields };
    console.log("Vendor data loaded successfully", result);
    return result;
  } catch (error) {
    console.error("Error loading vendor data", error);
    throw error;
  }
};

export const loadVendorsByStore = async (
  storeId: string,
): Promise<StoreVendor[]> => {
  try {
    const client = await getApolloClient();

    const { data } = await client.query({
      query: gql(getVendorsByStore),
      variables: { vendorsByStoreInput: { storeId } },
      fetchPolicy: "no-cache",
    });

    const vendors = (data["getVendorsByStore"] ?? []) as Array<
      StoreVendor & { __typename?: string }
    >;
    const result: StoreVendor[] = vendors.map(
      ({ __typename, ...rest }) => rest,
    );
    return result;
  } catch (error) {
    console.error("Error loading vendors by store", error);
    throw error;
  }
};

export const getApolloClient = async (): Promise<
  ApolloClient<NormalizedCacheObject>
> => {
  if (!apolloClient) {
    const { account } = await Sales.getConfig();
    const salesAuthContext =
      await Eitri.sharedStorage.getItemJson("salesAuthContext");
    const vtexIdToken = salesAuthContext?.vtexIdToken ?? "";
    apolloClient = await startApolloClient(account, vtexIdToken);
  }
  return apolloClient;
};

// Depois precisamos pensar onde colocar esta gestão do client
// Considerando que ele usa os headers, pode ser importante invalidar ele caso usuario
// nao esteja logado ou faça logout
async function startApolloClient(
  account: string,
  vtexIdToken: string,
): Promise<ApolloClient<NormalizedCacheObject>> {
  // tem uma regrinha diferente para login do SalesApp
  const headers: Record<string, string> = {
    Cookie: `_vss=${vtexIdToken}; VtexIdclientAutCookie=${vtexIdToken}; VtexUserIsLogged=true`,
  };

  return new ApolloClient({
    link: createEitriLink({
      uri: `https://${account}.myvtex.com/api/io/_v/private/graphql/v1`,
      headers,
    }),
    cache: new InMemoryCache(),
  });
}

function _getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function extractCookies(response: any, cookieName: string): string | null {
  if (!response || !response.headers || !cookieName) {
    return null;
  }
  const regex = new RegExp(`${cookieName}=(.*?);`, "i");
  const test = response?.headers["set-cookie"]?.match(regex);
  return test?.[1] ?? null;
}
