import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
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

const updateSchema = z.object({
  text: z.string().min(1),
});

// Correcting a note after the fact (typo, more detail once the driver's had a chance to explain).
driverNotesRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [existing] = await db.select().from(schema.driverNotes).where(eq(schema.driverNotes.id, req.params.id));
  if (!existing || !(await assertMachineInOrg(existing.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [updated] = await db
    .update(schema.driverNotes)
    .set(parsed.data)
    .where(eq(schema.driverNotes.id, req.params.id))
    .returning();
  res.json(updated);
});
