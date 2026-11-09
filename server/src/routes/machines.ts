import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { assertLocationInOrg, getMachinePassport } from "../lib/machineContext";
import { evaluateMilestone } from "../lib/milestones";
import { requireAuth, requireRole } from "../lib/auth";

export const machinesRouter = Router();
machinesRouter.use(requireAuth);

// "Activity" is the greater of machines.updatedAt (bumped automatically on every edit — see
// the PATCH route below) and the latest timestamp across everything logged against the machine,
// including a milestone being marked done (that's real activity on the machine too).
async function getLastActivityByMachine(machineIds: string[]) {
  const lastActivity = new Map<string, Date>();
  if (machineIds.length === 0) return lastActivity;

  const [repairLogs, driverNotes, hoursEntries, diagnosticEntries, parts, milestoneCompletions] = await Promise.all([
    db
      .select({ machineId: schema.repairLogs.machineId, ts: schema.repairLogs.createdAt })
      .from(schema.repairLogs)
      .where(inArray(schema.repairLogs.machineId, machineIds)),
    db
      .select({ machineId: schema.driverNotes.machineId, ts: schema.driverNotes.createdAt })
      .from(schema.driverNotes)
      .where(inArray(schema.driverNotes.machineId, machineIds)),
    db
      .select({ machineId: schema.hoursEntries.machineId, ts: schema.hoursEntries.recordedAt })
      .from(schema.hoursEntries)
      .where(inArray(schema.hoursEntries.machineId, machineIds)),
    db
      .select({ machineId: schema.diagnosticEntries.machineId, ts: schema.diagnosticEntries.createdAt })
      .from(schema.diagnosticEntries)
      .where(inArray(schema.diagnosticEntries.machineId, machineIds)),
    db
      .select({ machineId: schema.parts.machineId, ts: schema.parts.orderedAt })
      .from(schema.parts)
      .where(inArray(schema.parts.machineId, machineIds)),
    db
      .select({ machineId: schema.milestones.machineId, ts: schema.milestones.lastCompletedAt })
      .from(schema.milestones)
      .where(and(inArray(schema.milestones.machineId, machineIds))),
  ]);

  for (const row of [...repairLogs, ...driverNotes, ...hoursEntries, ...diagnosticEntries, ...parts, ...milestoneCompletions]) {
    if (!row.ts) continue;
    const current = lastActivity.get(row.machineId);
    if (!current || row.ts > current) lastActivity.set(row.machineId, row.ts);
  }
  return lastActivity;
}

// How many of each machine's milestones are currently due, or coming up soon — feeds the
// dashboard's maintenance alerts section. Needs each machine's latest reading (in its own
// tracked unit) to evaluate.
async function getMilestoneAlertCounts(machines: { id: string; trackingUnit: "hours" | "miles" }[]) {
  const dueCounts = new Map<string, number>();
  const upcomingCounts = new Map<string, number>();
  const machineIds = machines.map((m) => m.id);
  if (machineIds.length === 0) return { dueCounts, upcomingCounts };

  const [milestoneRows, hoursRows] = await Promise.all([
    db.select().from(schema.milestones).where(inArray(schema.milestones.machineId, machineIds)),
    db
      .select({ machineId: schema.hoursEntries.machineId, hours: schema.hoursEntries.hours, distance: schema.hoursEntries.distance })
      .from(schema.hoursEntries)
      .where(inArray(schema.hoursEntries.machineId, machineIds))
      .orderBy(desc(schema.hoursEntries.recordedAt)),
  ]);

  const latestReadingByMachine = new Map<string, { hours: number | null; distance: number | null }>();
  for (const row of hoursRows) {
    if (!latestReadingByMachine.has(row.machineId)) latestReadingByMachine.set(row.machineId, row);
  }

  const trackingUnitByMachine = new Map(machines.map((m) => [m.id, m.trackingUnit]));
  const milestonesByMachine = new Map<string, typeof milestoneRows>();
  for (const m of milestoneRows) {
    milestonesByMachine.set(m.machineId, [...(milestonesByMachine.get(m.machineId) ?? []), m]);
  }

  for (const [machineId, machineMilestones] of milestonesByMachine) {
    const unit = trackingUnitByMachine.get(machineId) ?? "hours";
    const latest = latestReadingByMachine.get(machineId);
    const currentValue = latest ? (unit === "hours" ? latest.hours : latest.distance) : null;
    const statuses = machineMilestones.map((m) => evaluateMilestone(m, currentValue));
    const dueCount = statuses.filter((s) => s.isDue).length;
    const upcomingCount = statuses.filter((s) => s.isUpcoming).length;
    if (dueCount > 0) dueCounts.set(machineId, dueCount);
    if (upcomingCount > 0) upcomingCounts.set(machineId, upcomingCount);
  }
  return { dueCounts, upcomingCounts };
}

// List — basic fleet list feeding the mobile dashboard, scoped to the caller's organization.
machinesRouter.get("/", async (req, res) => {
  const machineRows = await db
    .select()
    .from(schema.machines)
    .where(eq(schema.machines.organizationId, req.user!.organizationId))
    .orderBy(schema.machines.name);

  const [lastActivity, { dueCounts, upcomingCounts }, locationRows] = await Promise.all([
    getLastActivityByMachine(machineRows.map((m) => m.id)),
    getMilestoneAlertCounts(machineRows),
    db.select().from(schema.locations).where(eq(schema.locations.organizationId, req.user!.organizationId)),
  ]);
  const locationsById = new Map(locationRows.map((l) => [l.id, l]));
  const machines = machineRows.map((m) => {
    const childActivity = lastActivity.get(m.id);
    const lastActivityAt = childActivity && childActivity > m.updatedAt ? childActivity : m.updatedAt;
    return {
      ...m,
      lastActivityAt,
      dueMilestonesCount: dueCounts.get(m.id) ?? 0,
      upcomingMilestonesCount: upcomingCounts.get(m.id) ?? 0,
      location: m.locationId ? (locationsById.get(m.locationId) ?? null) : null,
    };
  });
  res.json(machines);
});

// The passport — identity + full history.
machinesRouter.get("/:id", async (req, res) => {
  const passport = await getMachinePassport(req.params.id, req.user!.organizationId);
  if (!passport) return res.status(404).json({ error: "not found" });
  res.json(passport);
});

const createSchema = z.object({
  name: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  serialOrVin: z.string().optional(),
  engineNumber: z.string().optional(),
  fleetNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  registrationExpiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
  // nullable (not just optional) so a PATCH can explicitly clear an already-assigned location —
  // omitting the key means "leave unchanged" below, same as every other field here.
  locationId: z.string().nullable().optional(),
  trackingUnit: z.enum(["hours", "miles"]).optional(),
});

// Creating/editing machines is fleet composition, not day-to-day logging — same tier as Locations.
machinesRouter.post("/", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (parsed.data.locationId != null && !(await assertLocationInOrg(parsed.data.locationId, req.user!.organizationId))) {
    return res.status(400).json({ error: "invalid location" });
  }
  const [machine] = await db
    .insert(schema.machines)
    .values({ ...parsed.data, organizationId: req.user!.organizationId })
    .returning();
  res.status(201).json(machine);
});

const updateSchema = createSchema.partial();

// Correcting a machine's identity fields after the fact — this didn't exist until now, so
// anything wrong at creation (typo'd engine number, missing registration expiry) was permanent.
machinesRouter.patch("/:id", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (Object.keys(parsed.data).length === 0) return res.status(400).json({ error: "no fields to update" });
  if (parsed.data.locationId != null && !(await assertLocationInOrg(parsed.data.locationId, req.user!.organizationId))) {
    return res.status(400).json({ error: "invalid location" });
  }

  const [existing] = await db
    .select({ id: schema.machines.id })
    .from(schema.machines)
    .where(and(eq(schema.machines.id, req.params.id), eq(schema.machines.organizationId, req.user!.organizationId)));
  if (!existing) return res.status(404).json({ error: "not found" });

  const [updated] = await db.update(schema.machines).set(parsed.data).where(eq(schema.machines.id, req.params.id)).returning();
  res.json(updated);
});
