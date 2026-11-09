import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth, requireRole } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const repairLogsRouter = Router();
repairLogsRouter.use(requireAuth);
// Logging/correcting repairs is mechanic-and-up work — not a driver action.
repairLogsRouter.use(requireRole("ADMIN", "MANAGER", "MECHANIC"));

const createSchema = z.object({
  machineId: z.string(),
  description: z.string().min(1),
  costCents: z.number().int().nonnegative().default(0),
});

// A mechanic logs a repair — parts/cost captured on this, appears immediately in the passport.
repairLogsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [log] = await db
    .insert(schema.repairLogs)
    .values({ ...parsed.data, mechanicId: req.user!.id })
    .returning();
  res.status(201).json(log);
});

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  costCents: z.number().int().nonnegative().optional(),
});

// Correcting a repair log after the fact (wrong cost, more detail on what was done) —
// scoped the same way every other machine-child record is: it must belong to the caller's org.
repairLogsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (Object.keys(parsed.data).length === 0) return res.status(400).json({ error: "no fields to update" });

  const [existing] = await db.select().from(schema.repairLogs).where(eq(schema.repairLogs.id, req.params.id));
  if (!existing || !(await assertMachineInOrg(existing.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [updated] = await db.update(schema.repairLogs).set(parsed.data).where(eq(schema.repairLogs.id, req.params.id)).returning();
  res.json(updated);
});
