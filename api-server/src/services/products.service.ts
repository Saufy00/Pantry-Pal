import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import type { InsertProduct, Product } from "@workspace/db";

export async function listProducts() {
  return db.select().from(productsTable).orderBy(productsTable.name);
}

export async function getProductById(id: number) {
  const rows = await db.select().from(productsTable).where(eq(productsTable.id, id));
  return rows[0] ?? null;
}

export async function getProductByBarcode(barcode: string) {
  const rows = await db.select().from(productsTable).where(eq(productsTable.barcode, barcode));
  return rows[0] ?? null;
}

export async function createProduct(data: InsertProduct) {
  const rows = await db
    .insert(productsTable)
    .values({
      barcode: data.barcode,
      name: data.name,
      brand: data.brand ?? null,
      category: data.category ?? null,
      imageUrl: data.imageUrl ?? null,
    })
    .returning();
  return rows[0]!;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const rows = await db
    .update(productsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productsTable.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function lookupAndCacheProduct(barcode: string): Promise<Product | null> {
  // 1. Check local DB
  const localProduct = await getProductByBarcode(barcode);
  if (localProduct) {
    return localProduct;
  }

  // 2. Query external APIs
  const endpoints = [
    "https://world.openfoodfacts.org",
    "https://world.openproductsfacts.org",
    "https://world.openbeautyfacts.org"
  ];

  for (const baseUrl of endpoints) {
    try {
      const res = await fetch(`${baseUrl}/api/v0/product/${barcode}.json`);
      if (!res.ok) continue;
      const json = (await res.json()) as any;
      if (json.status === 1 && json.product) {
        const p = json.product;
        const name = p.product_name || p.product_name_en;
        if (!name) continue;

        const category = p.categories_tags?.[0]?.replace('en:', '').replace('-', ' ') || 'Other';
        const brand = p.brands || null;
        const imageUrl = p.image_url || null;

        // Auto-cache to local DB
        const saved = await createProduct({
          barcode,
          name,
          brand,
          category,
          imageUrl,
        });
        return saved;
      }
    } catch (err) {
      console.error(`Error fetching barcode ${barcode} from ${baseUrl}:`, err);
    }
  }

  return null;
}
