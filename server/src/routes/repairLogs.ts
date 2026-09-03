import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const repairLogsRouter = Router();
repairLogsRouter.use(requireAuth);

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
  const [log] = await db.insert(schema.repairLogs).values({ ...parsed.data, mechanicId: req.user!.id }).returning();
  res.status(201).json(log);
});
