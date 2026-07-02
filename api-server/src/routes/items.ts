import { Router } from "express";
import {
  ListItemsQueryParams,
  CreateItemBody,
  UpdateItemParams,
  UpdateItemBody,
  DeleteItemParams,
  GetItemParams,
  UpdateItemStatusParams,
  UpdateItemStatusBody,
  AdjustItemQuantityParams,
  AdjustItemQuantityBody,
  CreateShoppingItemBody,
  UpdateShoppingItemParams,
  UpdateShoppingItemBody,
  DeleteShoppingItemParams,
  CreateProductBody,
  LookupProductByBarcodeParams,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  ListProductsQueryParams,
} from "@workspace/api-zod";
import * as itemsService from "../services/items.service";
import * as productsService from "../services/products.service";
import { badRequest, created, noContent, notFound } from "../utils/response";
import { addSseClient, removeSseClient, broadcast } from "../lib/sse";

const router = Router();

// ── Server-Sent Events stream ──────────────────────────────────────────────
router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if present
  res.flushHeaders();

  // Initial ping so the client knows the connection is live
  res.write("event: connected\ndata: {}\n\n");

  const clientId = addSseClient(res);

  // Keepalive every 25 s to prevent proxy timeouts
  const keepalive = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(keepalive);
    }
  }, 25_000);

  req.on("close", () => {
    clearInterval(keepalive);
    removeSseClient(clientId);
  });
  
  res.on("error", () => {
    clearInterval(keepalive);
    removeSseClient(clientId);
  });
});

// ── Read endpoints ─────────────────────────────────────────────────────────
router.get("/items/summary", async (_req, res) => {
  const summary = await itemsService.getItemsSummary();
  return res.json(summary);
});

router.get("/items/needs-restock", async (_req, res) => {
  const items = await itemsService.getNeedsRestock();
  return res.json(items);
});

router.get("/items/categories", async (_req, res) => {
  const categories = await itemsService.getCategorySummary();
  return res.json(categories);
});

router.get("/items/locations", async (_req, res) => {
  const locations = await itemsService.getLocationSummary();
  return res.json(locations);
});

router.get("/items/:id", async (req, res) => {
  const parsed = GetItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return badRequest(res);

  const item = await itemsService.getItemById(parsed.data.id);
  if (!item) return notFound(res, "Item not found");

  return res.json(item);
});

router.get("/items", async (req, res) => {
  const parsed = ListItemsQueryParams.safeParse(req.query);
  if (!parsed.success) return badRequest(res, "Invalid query params");

  const items = await itemsService.listItems({
    category: parsed.data.category,
    location: parsed.data.location,
    status: parsed.data.status as "in_stock" | "low" | "out" | undefined,
  });
  return res.json(items);
});

// ── Write endpoints (each broadcasts after success) ────────────────────────
router.patch("/items/:id/status", async (req, res) => {
  const parsedParams = UpdateItemStatusParams.safeParse({ id: Number(req.params.id) });
  const parsedBody = UpdateItemStatusBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) return badRequest(res);

  const item = await itemsService.updateItemStatus(parsedParams.data.id, {
    status: parsedBody.data.status as "in_stock" | "low" | "out",
    updatedBy: parsedBody.data.updatedBy,
  });
  if (!item) return notFound(res, "Item not found");

  broadcast("item:updated", { id: item.id, field: "status" });
  return res.json(item);
});

router.patch("/items/:id/quantity", async (req, res) => {
  const parsedParams = AdjustItemQuantityParams.safeParse({ id: Number(req.params.id) });
  const parsedBody = AdjustItemQuantityBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) return badRequest(res);

  const item = await itemsService.adjustItemQuantity(parsedParams.data.id, parsedBody.data.delta);
  if (!item) return notFound(res, "Item not found");

  broadcast("item:updated", { id: item.id, field: "quantity" });
  return res.json(item);
});

router.patch("/items/:id", async (req, res) => {
  const parsedParams = UpdateItemParams.safeParse({ id: Number(req.params.id) });
  const parsedBody = UpdateItemBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) return badRequest(res);

  const item = await itemsService.updateItem(parsedParams.data.id, parsedBody.data);
  if (!item) return notFound(res, "Item not found");

  broadcast("item:updated", { id: item.id });
  return res.json(item);
});

router.delete("/items/:id", async (req, res) => {
  const parsed = DeleteItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return badRequest(res);

  await itemsService.deleteItem(parsed.data.id);
  broadcast("item:deleted", { id: parsed.data.id });
  return noContent(res);
});

router.post("/items", async (req, res) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid input", parsed.error.issues);

  const item = await itemsService.createItem({
    name: parsed.data.name,
    category: parsed.data.category,
    location: parsed.data.location,
    status: parsed.data.status,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    minThreshold: parsed.data.minThreshold,
    notes: parsed.data.notes,
    updatedBy: parsed.data.updatedBy,
    expirationDate: parsed.data.expirationDate,
    productId: parsed.data.productId ?? null,
  });

  broadcast("item:created", { id: item.id });
  return created(res, item);
});

// ── Shopping endpoints ─────────────────────────────────────────────────────

router.get("/shopping", async (_req, res) => {
  const items = await itemsService.listShoppingItems();
  return res.json(items);
});

router.post("/shopping", async (req, res) => {
  const parsed = CreateShoppingItemBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid input", parsed.error.issues);
  const item = await itemsService.createShoppingItem(parsed.data);
  broadcast("shopping:created", { id: item.id });
  return created(res, item);
});

router.patch("/shopping/:id", async (req, res) => {
  const parsedParams = UpdateShoppingItemParams.safeParse({ id: Number(req.params.id) });
  const parsedBody = UpdateShoppingItemBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) return badRequest(res);
  const item = await itemsService.updateShoppingItem(parsedParams.data.id, parsedBody.data);
  if (!item) return notFound(res, "Item not found");
  broadcast("shopping:updated", { id: item.id });
  return res.json(item);
});

router.delete("/shopping/:id", async (req, res) => {
  const parsed = DeleteShoppingItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return badRequest(res);
  await itemsService.deleteShoppingItem(parsed.data.id);
  broadcast("shopping:deleted", { id: parsed.data.id });
  return noContent(res);
});

// ── Product Catalog endpoints ──────────────────────────────────────────────────

router.get("/products/barcode/:barcode", async (req, res) => {
  const parsed = LookupProductByBarcodeParams.safeParse({ barcode: req.params.barcode });
  if (!parsed.success) return badRequest(res, "Invalid barcode");

  const product = await productsService.lookupAndCacheProduct(parsed.data.barcode);
  if (!product) return notFound(res, "Product not found");

  return res.json(product);
});

router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) return badRequest(res, "Invalid query params");

  const products = await productsService.listProducts(parsed.data.search);
  return res.json(products);
});

router.post("/products", async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) return badRequest(res, "Invalid input", parsed.error.issues);

  const product = await productsService.createProduct(parsed.data);
  broadcast("product:created", { id: product.id });
  return created(res, product);
});

router.get("/products/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return badRequest(res);

  const product = await productsService.getProductById(parsed.data.id);
  if (!product) return notFound(res, "Product not found");

  return res.json(product);
});

router.patch("/products/:id", async (req, res) => {
  const parsedParams = UpdateProductParams.safeParse({ id: Number(req.params.id) });
  const parsedBody = UpdateProductBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) return badRequest(res);

  const product = await productsService.updateProduct(parsedParams.data.id, parsedBody.data);
  if (!product) return notFound(res, "Product not found");

  broadcast("product:updated", { id: product.id });
  return res.json(product);
});

export default router;
