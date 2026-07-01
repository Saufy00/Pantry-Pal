import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => productsTable.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull().default("Pantry"),
  status: text("status").notNull().default("in_stock"),
  quantity: text("quantity"),
  unit: text("unit"),
  minThreshold: integer("min_threshold"),
  notes: text("notes"),
  updatedBy: text("updated_by"),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateItemSchema = insertItemSchema.partial();

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
