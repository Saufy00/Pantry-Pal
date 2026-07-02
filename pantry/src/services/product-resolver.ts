import { Product, lookupProductByBarcode } from "@workspace/api-client-react";
import { getCachedProductByBarcode, saveCachedProduct } from "@/utils/db-cache";

export type ResolveResult =
  | { status: "found"; product: Product; source: "cache" | "server" }
  | { status: "not_found"; barcode: string }
  | { status: "error"; barcode: string; message: string };

const inFlightResolvers = new Map<string, Promise<ResolveResult>>();

export async function resolveProduct(barcode: string): Promise<ResolveResult> {
  // Prevent duplicate lookups if the same barcode is scanned rapidly
  if (inFlightResolvers.has(barcode)) {
    return inFlightResolvers.get(barcode)!;
  }

  const resolverPromise = (async (): Promise<ResolveResult> => {
    try {
      // 1. Check local IndexedDB cache first
      const cached = await getCachedProductByBarcode(barcode);
      if (cached) {
        return { status: "found", product: cached, source: "cache" };
      }

      // 2. Fallback to backend API cascade
      const product = await lookupProductByBarcode(barcode);
      
      if (product) {
        // Cache it immediately for future scans
        await saveCachedProduct(product);
        return { status: "found", product, source: "server" };
      }

      return { status: "not_found", barcode };

    } catch (error: any) {
      // The API client throws if response is not 2xx.
      // HTTP 404 indicates the barcode is unknown in the catalog and upstream APIs.
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return { status: "not_found", barcode };
      }

      // Distinguish network/offline errors vs general server errors
      let message = "An error occurred while looking up the product.";
      if (!navigator.onLine || error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError") || error?.message?.includes("fetch failed")) {
        message = "You appear to be offline, and this barcode is not cached locally.";
      }

      return { status: "error", barcode, message };
    } finally {
      // Remove the lock once resolved
      inFlightResolvers.delete(barcode);
    }
  })();

  inFlightResolvers.set(barcode, resolverPromise);
  return resolverPromise;
}
