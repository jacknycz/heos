import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "../db";

export const machinesRouter = Router();

// List — basic fleet list feeding the mobile dashboard.
machinesRouter.get("/", async (_req, res) => {
  const machines = await db.select().from(schema.machines).orderBy(schema.machines.name);
  res.json(machines);
});

// The passport — identity + full history.
machinesRouter.get("/:id", async (req, res) => {
  const [machine] = await db.select().from(schema.machines).where(eq(schema.machines.id, req.params.id));
  if (!machine) return res.status(404).json({ error: "not found" });

  const [repairLogsList, driverNotesList, hoursEntriesList, diagnosticEntriesList, partsList] = await Promise.all([
    db.select().from(schema.repairLogs).where(eq(schema.repairLogs.machineId, machine.id)).orderBy(desc(schema.repairLogs.createdAt)),
    db.select().from(schema.driverNotes).where(eq(schema.driverNotes.machineId, machine.id)).orderBy(desc(schema.driverNotes.createdAt)),
    db.select().from(schema.hoursEntries).where(eq(schema.hoursEntries.machineId, machine.id)).orderBy(desc(schema.hoursEntries.recordedAt)),
    db.select().from(schema.diagnosticEntries).where(eq(schema.diagnosticEntries.machineId, machine.id)).orderBy(desc(schema.diagnosticEntries.createdAt)),
    db.select().from(schema.parts).where(eq(schema.parts.machineId, machine.id)).orderBy(desc(schema.parts.orderedAt)),
  ]);

  res.json({
    ...machine,
    repairLogs: repairLogsList,
    driverNotes: driverNotesList,
    hoursEntries: hoursEntriesList,
    diagnosticEntries: diagnosticEntriesList,
    parts: partsList,
  });
});

const createSchema = z.object({
  name: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  serialOrVin: z.string().optional(),
});

machinesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [machine] = await db.insert(schema.machines).values(parsed.data).returning();
  res.status(201).json(machine);
});
