import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { getMachinePassport } from "../lib/machineContext";
import { requireAuth } from "../lib/auth";

export const machinesRouter = Router();
machinesRouter.use(requireAuth);

// List — basic fleet list feeding the mobile dashboard, scoped to the caller's organization.
machinesRouter.get("/", async (req, res) => {
  const machines = await db
    .select()
    .from(schema.machines)
    .where(eq(schema.machines.organizationId, req.user!.organizationId))
    .orderBy(schema.machines.name);
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
});

machinesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [machine] = await db
    .insert(schema.machines)
    .values({ ...parsed.data, organizationId: req.user!.organizationId })
    .returning();
  res.status(201).json(machine);
});
