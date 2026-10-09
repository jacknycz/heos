import { and, eq, desc, inArray, asc } from "drizzle-orm";
import { db, schema } from "../db";
import { evaluateMilestone } from "./milestones";

// Confirms machineId belongs to organizationId before any child record can reference it —
// the boundary that keeps one organization's fleet data from leaking into another's.
export async function assertMachineInOrg(machineId: string, organizationId: string) {
  const [machine] = await db
    .select({ id: schema.machines.id })
    .from(schema.machines)
    .where(and(eq(schema.machines.id, machineId), eq(schema.machines.organizationId, organizationId)));
  return !!machine;
}

// Same boundary check as assertMachineInOrg, for validating a locationId supplied on a
// machine create/update before it's written.
export async function assertLocationInOrg(locationId: string, organizationId: string) {
  const [location] = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(and(eq(schema.locations.id, locationId), eq(schema.locations.organizationId, organizationId)));
  return !!location;
}

// The passport read used by both the passport screen and the chat assistant's context injection.
export async function getMachinePassport(machineId: string, organizationId: string) {
  const [machine] = await db
    .select()
    .from(schema.machines)
    .where(and(eq(schema.machines.id, machineId), eq(schema.machines.organizationId, organizationId)));
  if (!machine) return null;

  const location = machine.locationId
    ? ((await db.select().from(schema.locations).where(eq(schema.locations.id, machine.locationId)))[0] ?? null)
    : null;

  const [repairLogs, driverNotes, hoursEntries, diagnosticEntries, partRows, milestoneRows, chatSummaries, aiLogRows] = await Promise.all([
    db.select().from(schema.repairLogs).where(eq(schema.repairLogs.machineId, machine.id)).orderBy(desc(schema.repairLogs.createdAt)),
    db.select().from(schema.driverNotes).where(eq(schema.driverNotes.machineId, machine.id)).orderBy(desc(schema.driverNotes.createdAt)),
    db.select().from(schema.hoursEntries).where(eq(schema.hoursEntries.machineId, machine.id)).orderBy(desc(schema.hoursEntries.recordedAt)),
    db
      .select()
      .from(schema.diagnosticEntries)
      .where(eq(schema.diagnosticEntries.machineId, machine.id))
      .orderBy(desc(schema.diagnosticEntries.createdAt)),
    db.select().from(schema.parts).where(eq(schema.parts.machineId, machine.id)).orderBy(desc(schema.parts.orderedAt)),
    db.select().from(schema.milestones).where(eq(schema.milestones.machineId, machine.id)).orderBy(desc(schema.milestones.createdAt)),
    db.select().from(schema.chatSummaries).where(eq(schema.chatSummaries.machineId, machine.id)).orderBy(desc(schema.chatSummaries.createdAt)),
    db.select().from(schema.aiLogs).where(eq(schema.aiLogs.machineId, machine.id)).orderBy(desc(schema.aiLogs.createdAt)),
  ]);

  const partIds = partRows.map((p) => p.id);
  const receiptRows = partIds.length
    ? await db.select().from(schema.partReceipts).where(inArray(schema.partReceipts.partId, partIds)).orderBy(asc(schema.partReceipts.createdAt))
    : [];
  const receiptsByPart = new Map<string, typeof receiptRows>();
  for (const r of receiptRows) {
    receiptsByPart.set(r.partId, [...(receiptsByPart.get(r.partId) ?? []), r]);
  }
  const parts = partRows.map((p) => ({ ...p, receipts: receiptsByPart.get(p.id) ?? [] }));

  // hoursEntries are cumulative meter readings, so the most recent one (already sorted desc
  // above) is the machine's current reading in whichever unit it tracks.
  const latestEntry = hoursEntries[0];
  const currentTrackingValue = latestEntry ? (machine.trackingUnit === "hours" ? latestEntry.hours : latestEntry.distance) : null;
  const milestones = milestoneRows.map((m) => evaluateMilestone(m, currentTrackingValue));

  return {
    ...machine,
    location,
    repairLogs,
    driverNotes,
    hoursEntries,
    diagnosticEntries,
    parts,
    milestones,
    chatSummaries,
    aiLogs: aiLogRows,
    currentTrackingValue,
  };
}

// Flattens a passport into the system-prompt text the chat assistant is primed with.
export function machineContextToPrompt(passport: NonNullable<Awaited<ReturnType<typeof getMachinePassport>>>) {
  const lines = [
    `You are a knowledgeable heavy-equipment maintenance assistant. Answer freely and confidently ` +
      `using your own general knowledge and expertise, exactly as you would in any other conversation — ` +
      `manufacturer specs, typical maintenance intervals, common failure points, general best practice, ` +
      `all fair game even when they aren't mentioned below. The machine record below is supplementary ` +
      `context, not a restriction: use it to personalize and ground your answers in this machine's actual ` +
      `history, current reading, and open items whenever it's relevant, but never refuse or hedge on ` +
      `general advice just because something isn't logged in it.`,
    `Machine: ${passport.name}${[passport.make, passport.model, passport.year].filter(Boolean).length ? ` (${[passport.make, passport.model, passport.year].filter(Boolean).join(" ")})` : ""}`,
    passport.serialOrVin ? `Serial/VIN: ${passport.serialOrVin}` : null,
    "",
    `Recent repair logs (${passport.repairLogs.length}):`,
    ...passport.repairLogs.slice(0, 10).map((r) => `- ${r.description} — $${(r.costCents / 100).toFixed(2)}`),
    "",
    `Recent driver notes (${passport.driverNotes.length}):`,
    ...passport.driverNotes.slice(0, 10).map((n) => `- ${n.resolved ? "[resolved] " : ""}${n.text}`),
    "",
    `Recent hours/distance entries (${passport.hoursEntries.length}):`,
    ...passport.hoursEntries.slice(0, 5).map((h) => `- ${h.hours ?? "?"} hrs / ${h.distance ?? "?"} dist at ${h.recordedAt}`),
    "",
    `Parts & cost log (${passport.parts.length}):`,
    ...passport.parts.slice(0, 10).map((p) => `- ${p.partNumber} — $${(p.costCents / 100).toFixed(2)}`),
    "",
    `Current reading: ${passport.currentTrackingValue ?? "unknown"} ${passport.trackingUnit}`,
    `Maintenance milestones (${passport.milestones.length}):`,
    ...passport.milestones.map(
      (m) =>
        `- ${m.label} (${m.type === "recurring" ? `every ${m.thresholdValue}` : `at ${m.thresholdValue}`} ${passport.trackingUnit})${m.isComplete ? " [done]" : m.isDue ? " [DUE NOW]" : m.nextDueAtValue != null ? ` — next due at ${m.nextDueAtValue}` : ""}`,
    ),
  ];
  return lines.filter((l) => l !== null).join("\n");
}
