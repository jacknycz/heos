import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";

export const diagnosticsRouter = Router();
diagnosticsRouter.use(requireAuth);

const createSchema = z.object({
  machineId: z.string(),
  checklistName: z.string().min(1),
  answers: z.record(z.any()),
});

// Guided-checklist diagnostics — not free text or fault codes.
diagnosticsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [entry] = await db
    .insert(schema.diagnosticEntries)
    .values({
      machineId: parsed.data.machineId,
      checklistName: parsed.data.checklistName,
      answers: JSON.stringify(parsed.data.answers),
    })
    .returning();
  res.status(201).json(entry);
});
