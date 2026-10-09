import { Router } from "express";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { assertMachineInOrg } from "../lib/machineContext";
import { evaluateMilestone, getCurrentTrackingValue } from "../lib/milestones";
import { sendPushNotification } from "../lib/pushNotifications";

export const hoursEntriesRouter = Router();
hoursEntriesRouter.use(requireAuth);

const createSchema = z.object({
  machineId: z.string(),
  hours: z.number().optional(),
  distance: z.number().optional(),
});

// A milestone that just became due (wasn't before this entry, is now) pushes ADMIN/MANAGER
// users in the org — mechanics/drivers log the reading, managers decide what to do about it.
async function notifyNewlyDueMilestones(
  machine: { id: string; name: string; trackingUnit: "hours" | "miles"; organizationId: string },
  previousValue: number | null,
  newValue: number,
) {
  const milestoneRows = await db.select().from(schema.milestones).where(eq(schema.milestones.machineId, machine.id));
  const newlyDue = milestoneRows.filter((m) => !evaluateMilestone(m, previousValue).isDue && evaluateMilestone(m, newValue).isDue);
  if (newlyDue.length === 0) return;

  const recipients = await db
    .select({ pushToken: schema.users.pushToken })
    .from(schema.users)
    .where(and(eq(schema.users.organizationId, machine.organizationId), inArray(schema.users.role, ["ADMIN", "MANAGER"])));
  const tokens = recipients.map((r) => r.pushToken).filter((t): t is string => !!t);
  if (tokens.length === 0) return;

  const unitLabel = machine.trackingUnit === "hours" ? "hrs" : "mi";
  for (const milestone of newlyDue) {
    await sendPushNotification(tokens, `${machine.name}: ${milestone.label} due`, `Reached ${newValue} ${unitLabel}.`);
  }
}

// Manual hours/distance entry — a cumulative meter reading (like an odometer), not a delta.
// Feeds the preventative-maintenance milestone rules: any milestone newly crossed by this
// reading gets pushed to the org's admins/managers.
hoursEntriesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [machine] = await db.select().from(schema.machines).where(eq(schema.machines.id, parsed.data.machineId));
  if (!machine || !(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }

  const previousValue = await getCurrentTrackingValue(machine.id, machine.trackingUnit);
  const [entry] = await db
    .insert(schema.hoursEntries)
    .values({ ...parsed.data, enteredById: req.user!.id })
    .returning();

  const newValue = machine.trackingUnit === "hours" ? entry.hours : entry.distance;
  if (newValue != null) {
    await notifyNewlyDueMilestones(machine, previousValue, newValue);
  }

  res.status(201).json(entry);
});
