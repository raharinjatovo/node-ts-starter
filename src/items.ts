import { randomUUID } from "node:crypto";
import express, { type Router } from "express";
import { z } from "zod";
import { HttpError } from "./server.js";

export interface Item {
  id: string;
  name: string;
  description?: string;
}

const createItemSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  description: z.string().optional(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ");
    throw new HttpError(400, message);
  }
  return result.data;
}

export function createItemsRouter(): Router {
  const items = new Map<string, Item>();
  const router = express.Router();

  router.use(express.json());

  router.post("/", (req, res) => {
    const body = parseOrThrow(createItemSchema, req.body);
    const item: Item = { id: randomUUID(), name: body.name, description: body.description };
    items.set(item.id, item);
    res.status(201).json(item);
  });

  router.get("/", (_req, res) => {
    res.json(Array.from(items.values()));
  });

  router.get("/:id", (req, res) => {
    const item = items.get(req.params.id);
    if (!item) throw new HttpError(404, "Item not found");
    res.json(item);
  });

  router.patch("/:id", (req, res) => {
    const item = items.get(req.params.id);
    if (!item) throw new HttpError(404, "Item not found");

    const body = parseOrThrow(updateItemSchema, req.body);
    const updated: Item = {
      ...item,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };
    items.set(updated.id, updated);
    res.json(updated);
  });

  router.delete("/:id", (req, res) => {
    const item = items.get(req.params.id);
    if (!item) throw new HttpError(404, "Item not found");
    items.delete(item.id);
    res.status(204).end();
  });

  return router;
}
