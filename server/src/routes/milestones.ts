import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth, requireRole } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";
import { getCurrentTrackingValue } from "../lib/milestones";

export const milestonesRouter = Router();
milestonesRouter.use(requireAuth);

const createSchema = z.object({
  machineId: z.string(),
  label: z.string().min(1),
  type: z.enum(["recurring", "one_time"]),
  thresholdValue: z.number().positive(),
  // "Starting now" baseline (app computes this from the machine's current reading) — sets where
  // a recurring milestone's countdown starts from instead of zero. Deliberately not paired with
  // lastCompletedAt: this isn't a real completion event, so it won't show up as one in History.
  lastCompletedAtValue: z.number().optional(),
});

// A maintenance rule for a machine — "every 500 hrs, fluids check" (recurring) or "at 500 hrs,
// break-in service" (one_time). Measured against the machine's own trackingUnit.
// Defining/changing the PM schedule itself is fleet-management, not something any logged-in
// user should be able to do (contrast with /complete below, which any mechanic can hit).
milestonesRouter.post("/", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [milestone] = await db.insert(schema.milestones).values(parsed.data).returning();
  res.status(201).json(milestone);
});

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  type: z.enum(["recurring", "one_time"]).optional(),
  thresholdValue: z.number().positive().optional(),
  // Direct baseline set — the app computes this from an explicit "Due at" value the user typed
  // (e.g. recurring: dueAt - thresholdValue), so a specific future due point can be pinned
  // regardless of history. Not a completion event on its own — lastCompletedAt is untouched.
  lastCompletedAtValue: z.number().optional(),
  // "We just did this" from the edit screen — same effect as POST /:id/complete (reset the
  // baseline to today's reading and stamp lastCompletedAt), but bundled with any other field
  // edits in one request instead of a separate action.
  resetToCurrentValue: z.boolean().optional(),
});

// Correcting a milestone's rule (wrong label/interval), pinning an explicit next-due value, or
// resetting it as if just completed — all in one PATCH.
milestonesRouter.patch("/:id", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [existing] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, req.params.id));
  if (!existing || !(await assertMachineInOrg(existing.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const { resetToCurrentValue, ...fields } = parsed.data;
  let values: typeof fields & { lastCompletedAtValue?: number; lastCompletedAt?: Date } = fields;
  if (resetToCurrentValue) {
    const [machine] = await db.select().from(schema.machines).where(eq(schema.machines.id, existing.machineId));
    const currentValue = machine ? await getCurrentTrackingValue(existing.machineId, machine.trackingUnit) : null;
    values = { ...values, lastCompletedAtValue: currentValue ?? existing.thresholdValue, lastCompletedAt: new Date() };
  }
  if (Object.keys(values).length === 0) return res.status(400).json({ error: "no fields to update" });

  const [updated] = await db.update(schema.milestones).set(values).where(eq(schema.milestones.id, req.params.id)).returning();
  res.json(updated);
});

milestonesRouter.delete("/:id", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const [existing] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, req.params.id));
  if (!existing || !(await assertMachineInOrg(existing.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }
  await db.delete(schema.milestones).where(eq(schema.milestones.id, req.params.id));
  res.status(204).send();
});

// Marks a milestone done at the machine's current reading. Recurring: resets the countdown to
// fire again thresholdValue units later. One-time: done permanently.
// Marking a milestone done is the mechanic's own action, unlike defining the schedule above.
milestonesRouter.post("/:id/complete", requireRole("ADMIN", "MANAGER", "MECHANIC"), async (req, res) => {
  const [existing] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, req.params.id));
  if (!existing) return res.status(404).json({ error: "not found" });

  const [machine] = await db.select().from(schema.machines).where(eq(schema.machines.id, existing.machineId));
  if (!machine || machine.organizationId !== req.user!.organizationId) return res.status(404).json({ error: "not found" });

  const currentValue = await getCurrentTrackingValue(existing.machineId, machine.trackingUnit);
  const [updated] = await db
    .update(schema.milestones)
    .set({ lastCompletedAtValue: currentValue ?? existing.thresholdValue, lastCompletedAt: new Date() })
    .where(eq(schema.milestones.id, req.params.id))
    .returning();
  res.json(updated);
});
