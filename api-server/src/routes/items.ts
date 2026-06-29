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
} from "@workspace/api-zod";
import * as itemsService from "../services/items.service";
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
    notes: parsed.data.notes,
    updatedBy: parsed.data.updatedBy,
  });

  broadcast("item:created", { id: item.id });
  return created(res, item);
});

export default router;
