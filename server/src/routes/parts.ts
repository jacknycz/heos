import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const partsRouter = Router();
partsRouter.use(requireAuth);

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
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [part] = await db.insert(schema.parts).values(parsed.data).returning();
  res.status(201).json(part);
});

// Repeat-order detection: same part number ordered more than once across the fleet —
// the "4 filters nobody remembers ordering" scenario from the SOW. Scoped to the caller's org.
partsRouter.get("/repeat-orders", async (req, res) => {
  const orgParts = await db
    .select({ partNumber: schema.parts.partNumber })
    .from(schema.parts)
    .innerJoin(schema.machines, eq(schema.machines.id, schema.parts.machineId))
    .where(eq(schema.machines.organizationId, req.user!.organizationId));
  const counts = new Map<string, number>();
  for (const p of orgParts) counts.set(p.partNumber, (counts.get(p.partNumber) ?? 0) + 1);
  const repeats = [...counts.entries()].filter(([, count]) => count > 1).map(([partNumber, count]) => ({ partNumber, count }));
  res.json(repeats);
});
