import { and, eq, ilike, sql } from "drizzle-orm";
import { db, itemsTable, shoppingListTable, productsTable } from "@workspace/db";
import type { InsertItem, InsertShoppingItem } from "@workspace/db";

export type ItemStatus = "in_stock" | "low" | "out";

export type ListItemsFilter = {
  category?: string;
  location?: string;
  status?: ItemStatus;
  search?: string;
};

export type UpdateStatusInput = {
  status: ItemStatus;
  updatedBy?: string | null;
};

export type UpdateItemInput = Partial<Omit<InsertItem, "createdAt" | "updatedAt">>;

export async function listItems(filter: ListItemsFilter = {}) {
  const { category, location, status, search } = filter;
  const conditions: any[] = [];
  if (category) conditions.push(eq(itemsTable.category, category));
  if (location) conditions.push(eq(itemsTable.location, location));
  if (status) conditions.push(eq(itemsTable.status, status));
  if (search) conditions.push(ilike(itemsTable.name, `%${search}%`));

  const query = db
    .select({
      id: itemsTable.id,
      productId: itemsTable.productId,
      name: itemsTable.name,
      category: itemsTable.category,
      location: itemsTable.location,
      status: itemsTable.status,
      quantity: itemsTable.quantity,
      unit: itemsTable.unit,
      minThreshold: itemsTable.minThreshold,
      notes: itemsTable.notes,
      updatedBy: itemsTable.updatedBy,
      expirationDate: itemsTable.expirationDate,
      createdAt: itemsTable.createdAt,
      updatedAt: itemsTable.updatedAt,
      product: {
        id: productsTable.id,
        barcode: productsTable.barcode,
        name: productsTable.name,
        brand: productsTable.brand,
        category: productsTable.category,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      }
    })
    .from(itemsTable)
    .leftJoin(productsTable, eq(itemsTable.productId, productsTable.id));

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).orderBy(itemsTable.location, itemsTable.category, itemsTable.name)
    : await query.orderBy(itemsTable.location, itemsTable.category, itemsTable.name);

  return rows.map(r => ({
    ...r,
    product: r.productId ? r.product : null,
  }));
}

export async function getItemById(id: number) {
  const rows = await db
    .select({
      id: itemsTable.id,
      productId: itemsTable.productId,
      name: itemsTable.name,
      category: itemsTable.category,
      location: itemsTable.location,
      status: itemsTable.status,
      quantity: itemsTable.quantity,
      unit: itemsTable.unit,
      minThreshold: itemsTable.minThreshold,
      notes: itemsTable.notes,
      updatedBy: itemsTable.updatedBy,
      expirationDate: itemsTable.expirationDate,
      createdAt: itemsTable.createdAt,
      updatedAt: itemsTable.updatedAt,
      product: {
        id: productsTable.id,
        barcode: productsTable.barcode,
        name: productsTable.name,
        brand: productsTable.brand,
        category: productsTable.category,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      }
    })
    .from(itemsTable)
    .leftJoin(productsTable, eq(itemsTable.productId, productsTable.id))
    .where(eq(itemsTable.id, id));

  const r = rows[0];
  if (!r) return null;
  return {
    ...r,
    product: r.productId ? r.product : null,
  };
}

export async function createItem(data: InsertItem) {
  const rows = await db
    .insert(itemsTable)
    .values({
      productId: data.productId ?? null,
      name: data.name,
      category: data.category,
      location: data.location ?? "Pantry",
      status: data.status ?? "in_stock",
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      minThreshold: data.minThreshold ?? null,
      notes: data.notes ?? null,
      updatedBy: data.updatedBy ?? null,
      expirationDate: data.expirationDate ?? null,
    })
    .returning();
  return (await getItemById(rows[0]!.id))!;
}

export async function updateItem(id: number, data: UpdateItemInput) {
  const rows = await db
    .update(itemsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning();
  if (rows.length === 0) return null;
  return getItemById(id);
}

export async function updateItemStatus(id: number, input: UpdateStatusInput) {
  const rows = await db
    .update(itemsTable)
    .set({ status: input.status, updatedBy: input.updatedBy ?? null, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning();
  if (rows.length === 0) return null;
  return getItemById(id);
}

export async function adjustItemQuantity(id: number, delta: number) {
  const item = await getItemById(id);
  if (!item) return null;

  const current = parseFloat(item.quantity ?? "0") || 0;
  const next = Math.max(0, current + delta);
  
  let newStatus = item.status;
  if (item.minThreshold !== null && item.minThreshold !== undefined) {
    if (next <= 0) {
      newStatus = "out";
    } else if (next <= item.minThreshold) {
      newStatus = "low";
    } else {
      newStatus = "in_stock";
    }
  }

  const rows = await db
    .update(itemsTable)
    .set({ quantity: String(next), status: newStatus, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning();
  if (rows.length === 0) return null;
  return getItemById(id);
}

export async function deleteItem(id: number) {
  await db.delete(itemsTable).where(eq(itemsTable.id, id));
}

export async function getItemsSummary() {
  const rows = await db
    .select({ status: itemsTable.status, count: sql<number>`cast(count(*) as int)` })
    .from(itemsTable)
    .groupBy(itemsTable.status);

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return {
    total,
    inStock: rows.find((r) => r.status === "in_stock")?.count ?? 0,
    low: rows.find((r) => r.status === "low")?.count ?? 0,
    out: rows.find((r) => r.status === "out")?.count ?? 0,
  };
}

export async function getNeedsRestock() {
  const rows = await db
    .select({
      id: itemsTable.id,
      productId: itemsTable.productId,
      name: itemsTable.name,
      category: itemsTable.category,
      location: itemsTable.location,
      status: itemsTable.status,
      quantity: itemsTable.quantity,
      unit: itemsTable.unit,
      minThreshold: itemsTable.minThreshold,
      notes: itemsTable.notes,
      updatedBy: itemsTable.updatedBy,
      expirationDate: itemsTable.expirationDate,
      createdAt: itemsTable.createdAt,
      updatedAt: itemsTable.updatedAt,
      product: {
        id: productsTable.id,
        barcode: productsTable.barcode,
        name: productsTable.name,
        brand: productsTable.brand,
        category: productsTable.category,
        imageUrl: productsTable.imageUrl,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      }
    })
    .from(itemsTable)
    .leftJoin(productsTable, eq(itemsTable.productId, productsTable.id))
    .where(sql`${itemsTable.status} IN ('low', 'out')`)
    .orderBy(itemsTable.location, itemsTable.name);

  return rows.map(r => ({
    ...r,
    product: r.productId ? r.product : null,
  }));
}

export async function getCategorySummary() {
  const rows = await db
    .select({
      category: itemsTable.category,
      status: itemsTable.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(itemsTable)
    .groupBy(itemsTable.category, itemsTable.status);

  const map = new Map<string, { total: number; inStock: number; low: number; out: number }>();
  for (const row of rows) {
    if (!map.has(row.category)) map.set(row.category, { total: 0, inStock: 0, low: 0, out: 0 });
    const cat = map.get(row.category)!;
    cat.total += row.count;
    if (row.status === "in_stock") cat.inStock += row.count;
    if (row.status === "low") cat.low += row.count;
    if (row.status === "out") cat.out += row.count;
  }

  return Array.from(map.entries()).map(([category, counts]) => ({ category, ...counts }));
}

export async function getLocationSummary() {
  const rows = await db
    .select({
      location: itemsTable.location,
      status: itemsTable.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(itemsTable)
    .groupBy(itemsTable.location, itemsTable.status);

  const map = new Map<string, { total: number; inStock: number; low: number; out: number }>();
  for (const row of rows) {
    if (!map.has(row.location)) map.set(row.location, { total: 0, inStock: 0, low: 0, out: 0 });
    const loc = map.get(row.location)!;
    loc.total += row.count;
    if (row.status === "in_stock") loc.inStock += row.count;
    if (row.status === "low") loc.low += row.count;
    if (row.status === "out") loc.out += row.count;
  }

  return Array.from(map.entries()).map(([location, counts]) => ({ location, ...counts }));
}

// --- Shopping List Service --- //

export async function listShoppingItems() {
  return db.select().from(shoppingListTable).orderBy(shoppingListTable.id);
}

export async function createShoppingItem(data: InsertShoppingItem) {
  const rows = await db
    .insert(shoppingListTable)
    .values({
      name: data.name,
      checked: false,
    })
    .returning();
  return rows[0]!;
}

export async function updateShoppingItem(id: number, data: Partial<InsertShoppingItem>) {
  const rows = await db
    .update(shoppingListTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shoppingListTable.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteShoppingItem(id: number) {
  await db.delete(shoppingListTable).where(eq(shoppingListTable.id, id));
}
