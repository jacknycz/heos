import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const driverNotesRouter = Router();
driverNotesRouter.use(requireAuth);

const createSchema = z.object({
  machineId: z.string(),
  text: z.string().min(1),
});

// Driver flags an issue — visible to mechanics and the manager.
driverNotesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [note] = await db.insert(schema.driverNotes).values({ ...parsed.data, driverId: req.user!.id }).returning();
  res.status(201).json(note);
});
