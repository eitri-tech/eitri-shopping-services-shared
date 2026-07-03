import Eitri from "eitri-bifrost";
import { Vendor } from "../models/Vendor";
import {
  SalesAuthContext,
  SkuItem,
  OrderForm,
  CustomerProfile,
  ClientProfile,
  ClientProfileIdentification,
} from "../models/SalesCart";
import { Vtex } from "eitri-shopping-vtex-shared";
import { SalesUserService } from "./SalesUserService";
import Sales from "./Sales";
import { SaveSalesAssociatesOrderFormMutation } from "../queries/saveSalesAssociatesOrderForm.gql";
import { useContractIdentification_GetClientProfileQuery } from "../queries/getClientProfile.gql";

export interface SaveSalesAssistedInput {
  cartTotal?: string;
  numberOfItems?: number;
  orderGroupId?: string;
  customerIdentification?: string;
  customerName?: string;
}

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  accept: "application/json",
};

export default class SalesCartService {
  private static _generateAssociateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private static async _getOrCreateAssociateCode(
    orderFormId: string,
  ): Promise<string> {
    const storageKey = `associateCode:${orderFormId}`;
    const existing = await Eitri.sharedStorage.getItem(storageKey);
    if (existing) return existing;
    const code = SalesCartService._generateAssociateCode();
    await Eitri.sharedStorage.setItem(storageKey, code);
    return code;
  }

  private static async _getConfig(): Promise<{
    account: string;
    baseUrl: string;
  }> {
    return Sales.getConfig();
  }

  private static _graphqlHeaders(
    vtexIdToken: string,
    account: string,
    userContext?: string | null,
  ): Record<string, string> {
    return SalesUserService.graphqlHeaders(vtexIdToken, account, userContext);
  }

  private static async _resolveUserContext(
    vtexIdToken: string,
    baseUrl: string,
    responseHeaders?: Record<string, any> | null,
    fallback?: string | null,
  ): Promise<string | null> {
    return SalesUserService.resolveUserContext(
      vtexIdToken,
      baseUrl,
      responseHeaders,
      fallback,
    );
  }

  /**
   * Creates orderForm with store tradePolicy.
   * Extracts userContext from response set-cookie if available.
   */
  private static async _createOrderForm(
    baseUrl: string,
    account: string,
    sc: string,
    existingUserContext?: string | null,
  ): Promise<{
    orderFormId: string;
    userContext: string | null;
    orderFormData: OrderForm;
  }> {
    console.log("[SalesCartService] Creating orderForm...");

    const ofRes = await Eitri.http.get(
      `${baseUrl}/api/checkout/pub/orderForm?an=${account}&sc=${sc}&disableAutoCompletion=true&forceNewCart=true`,
      { headers: JSON_HEADERS },
    );

    const orderFormId: string = ofRes.data.orderFormId;
    let userContext = existingUserContext ?? null;

    // Extract userContext from orderForm response set-cookie
    const ofSetCookies = ofRes.headers?.["set-cookie"];
    if (ofSetCookies) {
      const cookieString = Array.isArray(ofSetCookies)
        ? ofSetCookies.join("; ")
        : String(ofSetCookies);
      const match = cookieString.match(/userContext=([^;,\s]+)/);
      if (match) {
        userContext = decodeURIComponent(match[1]);
        console.log(
          "[SalesCartService] userContext extracted from orderForm response",
        );
      }
    }

    if (!userContext) {
      console.warn(
        "[SalesCartService] WARNING - userContext not found, subsequent steps may fail with 401",
      );
    }

    console.log("[SalesCartService] orderForm created successfully");
    return { orderFormId, userContext, orderFormData: ofRes.data as OrderForm };
  }

  /**
   * Check-in at store pickupPoint.
   */
  private static async _checkIn(
    baseUrl: string,
    account: string,
    sc: string,
    orderFormId: string,
    pickupPointId: string,
  ): Promise<void> {
    console.log("[SalesCartService] Checking in at pickupPoint...");

    const checkInRes = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/checkIn?an=${account}&sc=${sc}&disableAutoCompletion=true`,
      { isCheckedIn: false },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] Check-in completed with status",
      checkInRes.status,
    );
  }

  /**
   * Sets the store address as the delivery address in the orderForm.
   * Uses selectedAddresses with the vendor's store_linked address fields.
   */
  private static async _setShippingAddress(
    baseUrl: string,
    account: string,
    sc: string,
    orderFormId: string,
    store: import("../models/Vendor").StoreLinked,
  ): Promise<void> {
    console.log("[SalesCartService] Setting store shipping address...");

    const res = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/attachments/shippingData?an=${account}&sc=${sc}&disableAutoCompletion=true`,
      {
        clearAddressIfPostalCodeNotFound: false,
        selectedAddresses: [
          {
            street: store.address,
            number: store.number,
            neighborhood: store.neighborhood,
            city: store.city,
            state: store.state,
            postalCode: store.postalCode,
            country: store.country,
            complement: "",
            reference: "",
            geoCoordinates: [],
            addressType: "search",
          },
        ],
      },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] Shipping address set with status",
      res.status,
    );
  }

  /**
   * Sets session with store channel.
   */
  private static async _setSession(baseUrl: string, sc: string): Promise<void> {
    console.log("[SalesCartService] Setting session with store channel...");

    const sessionRes = await Eitri.http.post(
      `${baseUrl}/api/sessions?items=store.channel,profile.email,profile.priceTables,instore.flags`,
      { public: { channel: { value: sc } } },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] Session set with status",
      sessionRes.status,
    );
  }

  /**
   * Login to sales-app GraphQL and resolve userContext.
   */
  private static async _salesAppLogin(
    baseUrl: string,
    account: string,
    vtexIdToken: string,
    existingUserContext?: string | null,
  ): Promise<{ userContext: string | null; loginSuccess: boolean }> {
    console.log("[SalesCartService] Logging into sales-app...");
    const result = await SalesUserService.salesAppLogin(
      baseUrl,
      account,
      vtexIdToken,
      existingUserContext,
    );
    console.log(
      "[SalesCartService] Sales-app login completed, userContext",
      result.userContext ? "found" : "not found",
    );
    return result;
  }

  /**
   * Associates vendor to orderForm.
   */
  private static async _associateVendor(
    baseUrl: string,
    account: string,
    vtexIdToken: string,
    orderFormId: string,
    vendorCode: string,
    userContext: string | null,
  ): Promise<void> {
    console.log("[SalesCartService] Associating vendor...");

    const gqlHeaders = SalesCartService._graphqlHeaders(
      vtexIdToken,
      account,
      userContext,
    );

    const associateRes = await Eitri.http.post(
      `${baseUrl}/api/sales-app/graphql?operationName=SaveSalesAssociatesOrderFormMutation`,
      {
        query: SaveSalesAssociatesOrderFormMutation,
        variables: {
          input: {
            id: orderFormId,
            cartTotal: "",
            code: await SalesCartService._getOrCreateAssociateCode(orderFormId),
            customerIdentification: "",
            customerName: "isAnonymous",
            numberOfItems: 0,
            orderFormId,
            status: null,
            orderGroupId: "",
          },
        },
      },
      { headers: gqlHeaders },
    );

    console.log(
      "[SalesCartService] Vendor association completed with status",
      associateRes.status,
    );
  }

  /**
   * Sets anonymous customer profile.
   */
  private static async _setAnonymousProfile(
    baseUrl: string,
    orderFormId: string,
  ): Promise<void> {
    console.log("[SalesCartService] Setting anonymous profile...");

    const profileRes = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
      {
        firstName: "isAnonymous",
        profileSearchKey: "isAnonymous@isAnonymous.com",
      },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] Anonymous profile set with status",
      profileRes.status,
    );
  }

  /**
   * Sets marketing data (UTM tags and marketing tags) to orderForm.
   */
  private static async _setMarketingData(
    baseUrl: string,
    account: string,
    sc: string,
    orderFormId: string,
    vendorCode: string,
    storeId: string,
  ): Promise<void> {
    console.log("[SalesCartService] Setting marketing data...");

    const marketingDataRes = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/attachments/marketingData?an=${account}&sc=${sc}&disableAutoCompletion=true`,
      {
        utmSource: storeId,
        utmMedium: vendorCode,
        marketingTags: ["instore", "eitri-instore"],
      },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] Marketing data set with status",
      marketingDataRes.status,
    );
  }

  /**
   * Sets customData (customApps and customFields) to orderForm.
   * Used to store sales agent information for the order.
   */
  private static async _setCustomData(
    baseUrl: string,
    account: string,
    sc: string,
    orderFormId: string,
    vendorCode: string,
    vendorId: string,
    storeId: string,
  ): Promise<void> {
    console.log("[SalesCartService] Setting customData...");

    const customDataRes = await Eitri.http.put(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/customData/sales-app?an=${account}&sc=${sc}&disableAutoCompletion=true`,
      {
        // id: "sales-app",
        salesAgentCode: vendorCode,
        salesAgentId: vendorId,
        salesOperationPointId: storeId,
      },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] CustomData set with status",
      customDataRes.status,
    );
  }

  /**
   * Sets merchantContextData to orderForm.
   * Used to store sales associate information for the order.
   */
  private static async _setMerchantContextData(
    baseUrl: string,
    account: string,
    sc: string,
    orderFormId: string,
    vendorCode: string,
  ): Promise<void> {
    console.log("[SalesCartService] Setting merchantContextData...");

    const merchantContextDataRes = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/attachments/merchantContextData?an=${account}&sc=${sc}&disableAutoCompletion=true`,
      {
        salesAssociateData: {
          salesAssociateId: vendorCode,
        },
      },
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] MerchantContextData set with status",
      merchantContextDataRes.status,
    );
  }

  /**
   * Returns the share URL for a given orderFormId.
   * Retrieves the associate code from sharedStorage (does not generate a new one).
   * Returns null if no code exists for the given orderFormId.
   */
  static async getShareUrl(orderFormId: string): Promise<string | null> {
    const storageKey = `associateCode:${orderFormId}`;
    const code = await Eitri.sharedStorage.getItem(storageKey);
    if (!code) return null;
    const { baseUrl } = await SalesCartService._getConfig();
    return `${baseUrl}/api/io/_v/share/${code}?step=payment`;
  }

  /**
   * Reads vendor and auth context from shared storage.
   */
  static async getVendor(): Promise<{
    vendorData: Vendor | null;
    salesAuthContext: SalesAuthContext | null;
  }> {
    const vendorData: Vendor | null =
      await Eitri.sharedStorage.getItemJson("vendorData");
    const salesAuthContext: SalesAuthContext | null =
      await Eitri.sharedStorage.getItemJson("salesAuthContext");
    return { vendorData, salesAuthContext };
  }

  /**
   * Saves sales assisted data to the sales-app GraphQL with proper auth headers.
   */
  static async saveSalesAssisted(
    orderFormId: string,
    vendorCode: string,
    input: SaveSalesAssistedInput = {},
  ): Promise<any> {
    try {
      const { account, baseUrl } = await SalesCartService._getConfig();
      const { salesAuthContext } = await SalesCartService.getVendor();
      const vtexIdToken = salesAuthContext?.vtexIdToken ?? "";

      const { userContext } = await SalesCartService._salesAppLogin(
        baseUrl,
        account,
        vtexIdToken,
      );

      console.warn("[SalesCartService] User context resolved:", userContext);

      const headers = SalesCartService._graphqlHeaders(
        vtexIdToken,
        account,
        userContext,
      );

      const response = await Eitri.http.post(
        `${baseUrl}/api/sales-app/graphql?operationName=SaveSalesAssociatesOrderFormMutation`,
        {
          query: SaveSalesAssociatesOrderFormMutation,
          variables: {
            input: {
              id: orderFormId,
              orderFormId,
              code: await SalesCartService._getOrCreateAssociateCode(
                orderFormId,
              ),
              cartTotal: input.cartTotal ?? "",
              numberOfItems: input.numberOfItems ?? 0,
              customerIdentification: input.customerIdentification ?? "",
              customerName: input.customerName ?? "",
              orderGroupId: input.orderGroupId ?? "",
              status: null,
            },
          },
        },
        { headers },
      );
      return response.data;
    } catch (error) {
      console.error("[SalesCartService] Error in saveSalesAssisted:", error);
      throw error;
    }
  }

  /**
   * Initializes an orderForm in the assisted sales context (instore).
   * Executes the full chain: create cart → check-in → session → login → associate vendor → anonymous profile → marketing data → customData → merchantContextData.
   */
  static async initSalesCart(
    vendor: Vendor,
    salesAuthContext: SalesAuthContext,
  ): Promise<OrderForm> {
    try {
      console.log(
        "[SalesCartService] initSalesCart: Starting initialization...",
      );

      await Vtex.cart.clearCart();
      await Eitri.sharedStorage.removeItem("salesOrderFormId");

      const { account, baseUrl } = await SalesCartService._getConfig();
      const sc = vendor.store_linked.tradePolicy;
      const { vtexIdToken } = salesAuthContext;

      console.log("[SalesCartService] initSalesCart: Configuration loaded", {
        account,
        sc,
        vendorCode: vendor.code,
      });

      // Create orderForm
      const { orderFormId, userContext, orderFormData } =
        await SalesCartService._createOrderForm(
          baseUrl,
          account,
          sc,
          salesAuthContext.userContext,
        );

      // Check-in
      await SalesCartService._checkIn(
        baseUrl,
        account,
        sc,
        orderFormId,
        vendor.store_linked.pickupPoint,
      );

      // Set session
      await SalesCartService._setSession(baseUrl, sc);

      // Login & resolve userContext
      const { userContext: resolvedUserContext } =
        await SalesCartService._salesAppLogin(
          baseUrl,
          account,
          vtexIdToken,
          userContext,
        );

      // Associate vendor
      await SalesCartService._associateVendor(
        baseUrl,
        account,
        vtexIdToken,
        orderFormId,
        vendor.code,
        resolvedUserContext,
      );

      // Set store address as delivery address
      await SalesCartService._setShippingAddress(
        baseUrl,
        account,
        sc,
        orderFormId,
        vendor.store_linked,
      );

      // Set anonymous profile
      await SalesCartService._setAnonymousProfile(baseUrl, orderFormId);

      // Set marketing data
      await SalesCartService._setMarketingData(
        baseUrl,
        account,
        sc,
        orderFormId,
        vendor.code,
        vendor.store,
      );

      // Set customData (sales agent info)
      await SalesCartService._setCustomData(
        baseUrl,
        account,
        sc,
        orderFormId,
        vendor.code,
        vendor.id,
        vendor.store,
      );

      // Set merchantContextData (sales associate info)
      await SalesCartService._setMerchantContextData(
        baseUrl,
        account,
        sc,
        orderFormId,
        vendor.code,
      );

      // Store orderFormId for later use
      await Eitri.sharedStorage.setItem("salesOrderFormId", orderFormId);
      await Vtex.cart.saveCartIdOnStorage(orderFormId);

      await Eitri.eventBus.publish({
        channel: "SALES_CART_INITIALIZED",
        data: { orderFormId, vendorCode: vendor.code },
        broadcast: true,
      });

      console.log("[SalesCartService] initSalesCart: Completed successfully", {
        orderFormId,
      });

      return orderFormData;
    } catch (error) {
      console.error(
        "[SalesCartService] initSalesCart: Failed with error:",
        error,
      );
      throw error;
    }
  }

  /**
   * Adds an item to the assisted sales cart.
   * Maps skuItem (Vtex.catalog) format to OrderItem (checkout REST).
   */
  static async addItem(
    orderFormId: string,
    skuItem: SkuItem,
  ): Promise<OrderForm> {
    const { account, baseUrl } = await SalesCartService._getConfig();
    const orderItems = [
      {
        id: skuItem.itemId,
        quantity: skuItem.quantity ?? 1,
        seller: skuItem.sellers?.[0]?.sellerId ?? "1",
      },
    ];

    console.log("[SalesCartService] addItem: Adding item to cart", {
      orderFormId,
      itemId: skuItem.itemId,
      quantity: skuItem.quantity ?? 1,
    });

    const res = await Eitri.http.patch(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/items?an=${account}&sc=1&disableAutoCompletion=true`,
      { orderItems },
      { headers: JSON_HEADERS },
    );

    console.log("[SalesCartService] addItem: Item added successfully");
    return res.data as OrderForm;
  }

  /**
   * Identifies customer in orderForm by email or CPF (profileSearchKey).
   * When type is 'cpf', sends an anonymous email in the format {timestamp}-anonymous@vtex.com.
   * Replaces anonymous profile with actual customer profile.
   */
  static async identifyCustomer(
    orderFormId: string,
    value: string,
    sc: string,
    type: "email" | "cpf" = "email",
  ): Promise<CustomerProfile> {
    const { account, baseUrl } = await SalesCartService._getConfig();

    const body =
      type === "cpf"
        ? {
            profileSearchKey: value,
            document: value,
            documentType: "cpf",
            email: `${Date.now()}-anonymous@vtex.com`,
            firstName: "",
            lastName: "",
            phone: "",
            isCorporate: false,
          }
        : { profileSearchKey: value };

    console.log("[SalesCartService] identifyCustomer: Identifying customer", {
      orderFormId,
      type,
      value,
    });

    const res = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/attachments/clientProfileData?an=${account}&sc=${sc}&disableAutoCompletion=true`,
      body,
      { headers: JSON_HEADERS },
    );

    console.log(
      "[SalesCartService] identifyCustomer: Customer identified successfully",
    );
    return res.data as CustomerProfile;
  }

  /**
   * Fetches the client identification (id, name, user e-mail) from the sales-app GraphQL.
   */
  private static async _getClientProfileIdentification(
    baseUrl: string,
    headers: Record<string, string>,
    document: string,
  ): Promise<ClientProfileIdentification | null> {
    const res = await Eitri.http.post(
      `${baseUrl}/api/sales-app/graphql?operationName=useContractIdentification_GetClientProfileQuery`,
      {
        id: "useContractIdentification_GetClientProfileQuery",
        query: useContractIdentification_GetClientProfileQuery,
        variables: { key: document, includeChildren: false },
      },
      { headers },
    );
    return (res.data?.data?.clientProfile as ClientProfileIdentification) ?? null;
  }

  /**
   * Fetches client profile data from sales-app instore-functions by document.
   * Returns customer data (name, phone, address, lastOrders, etc.) wrapped in {label, data} fields.
   * The instore-functions endpoint does not return the customer e-mail, so it is
   * complemented via the GetClientProfileQuery GraphQL (email/identification fields).
   */
  static async getClientProfile(document: string): Promise<ClientProfile> {
    const { account, baseUrl } = await SalesCartService._getConfig();
    const { salesAuthContext } = await SalesCartService.getVendor();
    const vtexIdToken = salesAuthContext?.vtexIdToken ?? "";

    const { userContext } = await SalesCartService._salesAppLogin(
      baseUrl,
      account,
      vtexIdToken,
      salesAuthContext?.userContext,
    );

    const headers = SalesCartService._graphqlHeaders(
      vtexIdToken,
      account,
      userContext,
    );

    console.log("[SalesCartService] getClientProfile: Fetching profile", {
      document,
    });

    const res = await Eitri.http.post(
      `${baseUrl}/api/sales-app/instore-functions/client-profile?workspace=`,
      {
        document,
        VtexIdclientAutCookie: vtexIdToken,
        accountName: account,
      },
      { headers },
    );

    console.log(
      "[SalesCartService] getClientProfile: Profile fetched successfully",
    );

    const profile = res.data as ClientProfile;

    try {
      const identification =
        await SalesCartService._getClientProfileIdentification(
          baseUrl,
          headers,
          document,
        );
      if (identification) {
        profile.identification = identification;
        if (identification.user?.name) {
          profile.email = { data: identification.user.name };
        }
        console.log(
          "[SalesCartService] getClientProfile: Identification fetched successfully",
        );
      }
    } catch (e) {
      console.warn(
        "[SalesCartService] getClientProfile: Failed to fetch client identification",
        e,
      );
    }

    return profile;
  }

  /**
   * Removes an item from the assisted sales cart by index.
   */
  static async removeItem(
    orderFormId: string,
    itemIndex: number,
  ): Promise<OrderForm> {
    const { baseUrl } = await SalesCartService._getConfig();

    console.log("[SalesCartService] removeItem: Removing item from cart", {
      orderFormId,
      itemIndex,
    });

    const res = await Eitri.http.post(
      `${baseUrl}/api/checkout/pub/orderForm/${orderFormId}/items/update`,
      { orderItems: [{ index: itemIndex, quantity: 0 }] },
      { headers: JSON_HEADERS },
    );

    console.log("[SalesCartService] removeItem: Item removed successfully");
    return res.data as OrderForm;
  }
}
