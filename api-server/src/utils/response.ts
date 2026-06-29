import type { Response } from "express";

export function notFound(res: Response, message = "Resource not found") {
  return res.status(404).json({ error: message });
}

export function badRequest(res: Response, message = "Invalid input", details?: unknown) {
  return res.status(400).json({ error: message, ...(details ? { details } : {}) });
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json(data);
}
