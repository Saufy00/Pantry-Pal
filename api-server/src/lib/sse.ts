import type { Response } from "express";

type SseClient = { id: number; res: Response };

const clients = new Map<number, SseClient>();
let nextId = 1;

export function addSseClient(res: Response): number {
  const id = nextId++;
  clients.set(id, { id, res });
  return id;
}

export function removeSseClient(id: number): void {
  clients.delete(id);
}

export function broadcast(event: string, data: unknown = {}): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}

export function connectedClientCount(): number {
  return clients.size;
}
