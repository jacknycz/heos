import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const hoursEntriesRouter = Router();
hoursEntriesRouter.use(requireAuth);

const createSchema = z.object({
  machineId: z.string(),
  hours: z.number().optional(),
  distance: z.number().optional(),
});

// Manual hours/distance entry — feeds the preventative-maintenance alert rules.
hoursEntriesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [entry] = await db.insert(schema.hoursEntries).values({ ...parsed.data, enteredById: req.user!.id }).returning();
  // TODO: evaluate PM alert rules against this machine's latest hours/distance.
  res.status(201).json(entry);
});
