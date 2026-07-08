import Eitri from "eitri-bifrost";
import { Vendor } from "../models/Vendor";
import { SalesUserService } from "./SalesUserService";
import { SalesAssociatesScreenQuery } from "../queries/salesAssociatesScreen.gql";
import { SalesAssociatePerformanceScreenQuery } from "../queries/salesAssociatePerformanceScreen.gql";

export interface SalesAssociateNode {
  id: string;
  fullName: string;
}

export interface SalesIndicators {
  salesAmount: number;
  salesQuantity: number;
  totalItemsSold: number;
  averageItemAmount: number;
  averageItemsPerSale: number;
  averageSalesAmount: number;
}

export interface StoreIndicators {
  averageItemAmount: number;
  averageItemsPerSale: number;
  averageSalesAmount: number;
}

export interface SalesPerformanceData {
  salesAssociateName: string;
  currencyCode: string;
  indicators: SalesIndicators;
  storeIndicators: StoreIndicators;
}

export class SalesPerformanceService {
  static getCurrentMonthPeriod(): { startAt: string; endAt: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      startAt: `${year}-${month}-01`,
      endAt: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  static normalizeFullName(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  static matchVendorToAssociate(
    vendorName: string,
    nodes: SalesAssociateNode[],
  ): SalesAssociateNode | null {
    const normalized = SalesPerformanceService.normalizeFullName(vendorName);

    const exact = nodes.find(
      (n) => SalesPerformanceService.normalizeFullName(n.fullName) === normalized,
    );
    if (exact) return exact;

    const partial = nodes.find((n) => {
      const normFull = SalesPerformanceService.normalizeFullName(n.fullName);
      return normFull.startsWith(normalized) || normalized.startsWith(normFull);
    });
    return partial ?? null;
  }

  static async load(vendor: Vendor): Promise<SalesPerformanceData | null> {
    const { baseUrl, userContext, headers } =
      await SalesUserService.getGraphqlAuth();

    const gqlUrl = `${baseUrl}/api/sales-app/graphql`;

    const masterdataStoreId =
      (userContext
        ? SalesUserService.decodeMasterdataStoreId(userContext)
        : null) ?? vendor.store_linked.id;

    const associatesRes = await Eitri.http.post(
      `${gqlUrl}?operationName=SalesAssociatesScreenQuery`,
      {
        id: "SalesAssociatesScreenQuery",
        query: SalesAssociatesScreenQuery,
        variables: { masterdataId: masterdataStoreId },
      },
      { headers },
    );

    const storeData = associatesRes.data?.data?.store;
    if (!storeData) return null;

    const storeId: string = storeData.id;
    const nodes: SalesAssociateNode[] = storeData.salesAssociates?.nodes ?? [];

    const matched = SalesPerformanceService.matchVendorToAssociate(vendor.name, nodes);
    if (!matched) {
      console.warn(
        "[SalesPerformanceService] No matching sales associate found for vendor:",
        vendor.name,
      );
      return null;
    }

    const period = SalesPerformanceService.getCurrentMonthPeriod();

    const performanceRes = await Eitri.http.post(
      `${gqlUrl}?operationName=SalesAssociatePerformanceScreenQuery`,
      {
        id: "SalesAssociatePerformanceScreenQuery",
        query: SalesAssociatePerformanceScreenQuery,
        variables: { storeId, salesAssociateId: matched.id, period },
      },
      { headers },
    );

    const perfData = performanceRes.data?.data;
    if (!perfData) return null;

    const salesAssociateName: string =
      perfData.salesAssociate?.name ?? vendor.name;
    const currencyCode: string = perfData.viewer?.brand?.currencyCode ?? "BRL";
    const indicators: SalesIndicators = perfData.salesAssociate
      ?.salesIndicators ?? {
      salesAmount: 0,
      salesQuantity: 0,
      totalItemsSold: 0,
      averageItemAmount: 0,
      averageItemsPerSale: 0,
      averageSalesAmount: 0,
    };
    const storeIndicators: StoreIndicators = perfData.store?.salesIndicators ?? {
      averageItemAmount: 0,
      averageItemsPerSale: 0,
      averageSalesAmount: 0,
    };

    return { salesAssociateName, currencyCode, indicators, storeIndicators };
  }
}
