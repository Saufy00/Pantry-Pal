import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shoppingListTable = pgTable("shopping_list", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  checked: boolean("checked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShoppingItemSchema = createInsertSchema(shoppingListTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateShoppingItemSchema = insertShoppingItemSchema.partial();

export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
export type ShoppingItem = typeof shoppingListTable.$inferSelect;
