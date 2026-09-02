import { eq, desc } from "drizzle-orm";
import { db, schema } from "../db";

// The passport read used by both the passport screen and the chat assistant's context injection.
export async function getMachinePassport(machineId: string) {
  const [machine] = await db.select().from(schema.machines).where(eq(schema.machines.id, machineId));
  if (!machine) return null;

  const [repairLogs, driverNotes, hoursEntries, diagnosticEntries, parts] = await Promise.all([
    db.select().from(schema.repairLogs).where(eq(schema.repairLogs.machineId, machine.id)).orderBy(desc(schema.repairLogs.createdAt)),
    db.select().from(schema.driverNotes).where(eq(schema.driverNotes.machineId, machine.id)).orderBy(desc(schema.driverNotes.createdAt)),
    db.select().from(schema.hoursEntries).where(eq(schema.hoursEntries.machineId, machine.id)).orderBy(desc(schema.hoursEntries.recordedAt)),
    db.select().from(schema.diagnosticEntries).where(eq(schema.diagnosticEntries.machineId, machine.id)).orderBy(desc(schema.diagnosticEntries.createdAt)),
    db.select().from(schema.parts).where(eq(schema.parts.machineId, machine.id)).orderBy(desc(schema.parts.orderedAt)),
  ]);

  return { ...machine, repairLogs, driverNotes, hoursEntries, diagnosticEntries, parts };
}

// Flattens a passport into the system-prompt text the chat assistant is primed with.
export function machineContextToPrompt(passport: NonNullable<Awaited<ReturnType<typeof getMachinePassport>>>) {
  const lines = [
    `You are the maintenance assistant for this machine. Answer using the record below; say so if something isn't in it.`,
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
  ];
  return lines.filter((l) => l !== null).join("\n");
}
