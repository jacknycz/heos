import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";

export const partsRouter = Router();

const createSchema = z.object({
  machineId: z.string(),
  repairLogId: z.string().optional(),
  partNumber: z.string().min(1),
  description: z.string().optional(),
  costCents: z.number().int().nonnegative().default(0),
});

partsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [part] = await db.insert(schema.parts).values(parsed.data).returning();
  res.status(201).json(part);
});

// Repeat-order detection: same part number ordered more than once across the fleet —
// the "4 filters nobody remembers ordering" scenario from the SOW.
partsRouter.get("/repeat-orders", async (_req, res) => {
  const allParts = await db.select().from(schema.parts);
  const counts = new Map<string, number>();
  for (const p of allParts) counts.set(p.partNumber, (counts.get(p.partNumber) ?? 0) + 1);
  const repeats = [...counts.entries()].filter(([, count]) => count > 1).map(([partNumber, count]) => ({ partNumber, count }));
  res.json(repeats);
});
