import { Router } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth, requireRole } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const partsRouter = Router();
partsRouter.use(requireAuth);

const receiptImageSchema = z.string().startsWith("data:image/");

const createSchema = z.object({
  machineId: z.string(),
  repairLogId: z.string().optional(),
  partNumber: z.string().min(1),
  description: z.string().optional(),
  costCents: z.number().int().nonnegative().default(0),
  // Data URLs ("data:image/jpeg;base64,...") from the app's camera/photo-library picker — a
  // part can be created with receipts already attached instead of adding them one at a time.
  receiptImages: z.array(receiptImageSchema).optional(),
});

// Ordering/correcting parts is mechanic-and-up work, same tier as repair logs.
partsRouter.post("/", requireRole("ADMIN", "MANAGER", "MECHANIC"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const { receiptImages, ...partFields } = parsed.data;
  const [part] = await db.insert(schema.parts).values(partFields).returning();
  const receipts = receiptImages?.length
    ? await db
        .insert(schema.partReceipts)
        .values(receiptImages.map((image) => ({ partId: part.id, image })))
        .returning()
    : [];
  res.status(201).json({ ...part, receipts });
});

const updateSchema = z.object({
  partNumber: z.string().min(1).optional(),
  description: z.string().optional(),
  costCents: z.number().int().nonnegative().optional(),
});

// Correcting a part/cost entry after the fact (wrong cost, better description). Receipts are
// managed independently via the /:id/receipts routes below, not through this PATCH.
partsRouter.patch("/:id", requireRole("ADMIN", "MANAGER", "MECHANIC"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (Object.keys(parsed.data).length === 0) return res.status(400).json({ error: "no fields to update" });

  const [existing] = await db.select().from(schema.parts).where(eq(schema.parts.id, req.params.id));
  if (!existing || !(await assertMachineInOrg(existing.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [updated] = await db.update(schema.parts).set(parsed.data).where(eq(schema.parts.id, req.params.id)).returning();
  res.json(updated);
});

// Add one more receipt photo to an existing part — used once the part already exists (editing),
// as opposed to the receiptImages batch on creation above.
partsRouter.post("/:id/receipts", requireRole("ADMIN", "MANAGER", "MECHANIC"), async (req, res) => {
  const parsed = z.object({ image: receiptImageSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [part] = await db.select().from(schema.parts).where(eq(schema.parts.id, req.params.id));
  if (!part || !(await assertMachineInOrg(part.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [receipt] = await db.insert(schema.partReceipts).values({ partId: part.id, image: parsed.data.image }).returning();
  res.status(201).json(receipt);
});

partsRouter.delete("/:id/receipts/:receiptId", requireRole("ADMIN", "MANAGER", "MECHANIC"), async (req, res) => {
  const [part] = await db.select().from(schema.parts).where(eq(schema.parts.id, req.params.id));
  if (!part || !(await assertMachineInOrg(part.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  await db.delete(schema.partReceipts).where(and(eq(schema.partReceipts.id, req.params.receiptId), eq(schema.partReceipts.partId, part.id)));
  res.status(204).send();
});

// Mark a part as received — the fulfillment half of order status (ordered vs. received).
partsRouter.post("/:id/receive", requireRole("ADMIN", "MANAGER", "MECHANIC"), async (req, res) => {
  const [part] = await db.select().from(schema.parts).where(eq(schema.parts.id, req.params.id));
  if (!part || !(await assertMachineInOrg(part.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [updated] = await db.update(schema.parts).set({ receivedAt: new Date() }).where(eq(schema.parts.id, req.params.id)).returning();
  res.json(updated);
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
