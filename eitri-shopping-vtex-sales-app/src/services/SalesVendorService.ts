import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { Vendor, StoreVendor } from "../models/Vendor";
import {
  loadVendorData as _loadVendorData,
  loadVendorsByStore as _loadVendorsByStore,
  getApolloClient as _getApolloClient,
} from "./AssistedSalesService";

export class SalesVendorService {
  static async loadVendorData(): Promise<Vendor> {
    return _loadVendorData();
  }

  static async loadVendorsByStore(storeId: string): Promise<StoreVendor[]> {
    return _loadVendorsByStore(storeId);
  }

  static async getApolloClient(): Promise<ApolloClient<NormalizedCacheObject>> {
    return _getApolloClient();
  }
}
