import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";

export const repairLogsRouter = Router();

const createSchema = z.object({
  machineId: z.string(),
  mechanicId: z.string(),
  description: z.string().min(1),
  costCents: z.number().int().nonnegative().default(0),
});

// A mechanic logs a repair — parts/cost captured on this, appears immediately in the passport.
repairLogsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [log] = await db.insert(schema.repairLogs).values(parsed.data).returning();
  res.status(201).json(log);
});
