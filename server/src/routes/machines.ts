import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db";
import { getMachinePassport } from "../lib/machineContext";

export const machinesRouter = Router();

// List — basic fleet list feeding the mobile dashboard.
machinesRouter.get("/", async (_req, res) => {
  const machines = await db.select().from(schema.machines).orderBy(schema.machines.name);
  res.json(machines);
});

// The passport — identity + full history.
machinesRouter.get("/:id", async (req, res) => {
  const passport = await getMachinePassport(req.params.id);
  if (!passport) return res.status(404).json({ error: "not found" });
  res.json(passport);
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
