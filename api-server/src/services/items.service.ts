import { and, eq, sql } from "drizzle-orm";
import { db, itemsTable } from "@workspace/db";
import type { InsertItem } from "@workspace/db";

export type ItemStatus = "in_stock" | "low" | "out";

export type ListItemsFilter = {
  category?: string;
  location?: string;
  status?: ItemStatus;
};

export type UpdateStatusInput = {
  status: ItemStatus;
  updatedBy?: string | null;
};

export type UpdateItemInput = Partial<Omit<InsertItem, "createdAt" | "updatedAt">>;

export async function listItems(filter: ListItemsFilter = {}) {
  const { category, location, status } = filter;
  const conditions: ReturnType<typeof eq>[] = [];
  if (category) conditions.push(eq(itemsTable.category, category));
  if (location) conditions.push(eq(itemsTable.location, location));
  if (status) conditions.push(eq(itemsTable.status, status));

  const query = db.select().from(itemsTable);

  return conditions.length > 0
    ? query.where(and(...conditions)).orderBy(itemsTable.location, itemsTable.category, itemsTable.name)
    : query.orderBy(itemsTable.location, itemsTable.category, itemsTable.name);
}

export async function getItemById(id: number) {
  const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  return rows[0] ?? null;
}

export async function createItem(data: InsertItem) {
  const rows = await db
    .insert(itemsTable)
    .values({
      name: data.name,
      category: data.category,
      location: data.location ?? "Pantry",
      status: data.status ?? "in_stock",
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      notes: data.notes ?? null,
      updatedBy: data.updatedBy ?? null,
      expirationDate: data.expirationDate ?? null,
    })
    .returning();
  return rows[0]!;
}

export async function updateItem(id: number, data: UpdateItemInput) {
  const rows = await db
    .update(itemsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function updateItemStatus(id: number, input: UpdateStatusInput) {
  const rows = await db
    .update(itemsTable)
    .set({ status: input.status, updatedBy: input.updatedBy ?? null, updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function adjustItemQuantity(id: number, delta: number) {
  const item = await getItemById(id);
  if (!item) return null;

  const current = parseFloat(item.quantity ?? "0") || 0;
  const next = Math.max(0, current + delta);
  const rows = await db
    .update(itemsTable)
    .set({ quantity: String(next), updatedAt: new Date() })
    .where(eq(itemsTable.id, id))
    .returning();
  return rows[0] ?? null;
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
  return db
    .select()
    .from(itemsTable)
    .where(sql`${itemsTable.status} IN ('low', 'out')`)
    .orderBy(itemsTable.location, itemsTable.name);
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
