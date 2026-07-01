import type { Product } from "@workspace/api-client-react";

const DB_NAME = "pantry_pal_cache";
const DB_VERSION = 1;
const STORE_NAME = "products";

let dbInstance: IDBDatabase | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("barcode", "barcode", { unique: true });
        store.createIndex("name", "name", { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getCachedProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("barcode");
      const request = index.get(barcode);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB getCachedProductByBarcode error:", err);
    return null;
  }
}

export async function getCachedProductById(id: number): Promise<Product | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB getCachedProductById error:", err);
    return null;
  }
}

export async function saveCachedProduct(product: Product): Promise<void> {
  try {
    const db = await getDb();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(product);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB saveCachedProduct error:", err);
  }
}

export async function searchCachedProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  const normalizedQuery = query.toLowerCase();

  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      const results: Product[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const product = cursor.value as Product;
          const nameMatch = product.name?.toLowerCase().includes(normalizedQuery);
          const brandMatch = product.brand?.toLowerCase().includes(normalizedQuery);
          const barcodeMatch = product.barcode?.toLowerCase().includes(normalizedQuery);

          if (nameMatch || brandMatch || barcodeMatch) {
            results.push(product);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB searchCachedProducts error:", err);
    return [];
  }
}
