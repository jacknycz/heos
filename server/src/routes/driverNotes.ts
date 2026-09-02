import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";

export const driverNotesRouter = Router();

const createSchema = z.object({
  machineId: z.string(),
  driverId: z.string(),
  text: z.string().min(1),
});

// Driver flags an issue — visible to mechanics and the manager.
driverNotesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [note] = await db.insert(schema.driverNotes).values(parsed.data).returning();
  res.status(201).json(note);
});
