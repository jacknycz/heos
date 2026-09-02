import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";

export const hoursEntriesRouter = Router();

const createSchema = z.object({
  machineId: z.string(),
  enteredById: z.string(),
  hours: z.number().optional(),
  distance: z.number().optional(),
});

// Manual hours/distance entry — feeds the preventative-maintenance alert rules.
hoursEntriesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [entry] = await db.insert(schema.hoursEntries).values(parsed.data).returning();
  // TODO: evaluate PM alert rules against this machine's latest hours/distance.
  res.status(201).json(entry);
});
