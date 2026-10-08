import { Router } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth, requireAdmin } from "../lib/auth";

export const locationsRouter = Router();
locationsRouter.use(requireAuth);

// Any authenticated org member can list — the machine form's location picker isn't admin-gated,
// so this can't be either.
locationsRouter.get("/", async (req, res) => {
  const rows = await db
    .select()
    .from(schema.locations)
    .where(eq(schema.locations.organizationId, req.user!.organizationId))
    .orderBy(schema.locations.name);
  res.json(rows);
});

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

// Mutations are admin-only — Locations lives under Settings next to Team, an org-config
// resource, not a fleet-logging action anyone can create.
locationsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [location] = await db
    .insert(schema.locations)
    .values({ ...parsed.data, organizationId: req.user!.organizationId })
    .returning();
  res.status(201).json(location);
});

const updateSchema = createSchema.partial();

locationsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (Object.keys(parsed.data).length === 0) return res.status(400).json({ error: "no fields to update" });

  const [existing] = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(and(eq(schema.locations.id, req.params.id), eq(schema.locations.organizationId, req.user!.organizationId)));
  if (!existing) return res.status(404).json({ error: "not found" });

  const [updated] = await db.update(schema.locations).set(parsed.data).where(eq(schema.locations.id, req.params.id)).returning();
  res.json(updated);
});

// Safe as a plain delete — machines.locationId is ON DELETE SET NULL, so any machine assigned
// here just loses its location instead of blocking the delete.
locationsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const [existing] = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(and(eq(schema.locations.id, req.params.id), eq(schema.locations.organizationId, req.user!.organizationId)));
  if (!existing) return res.status(404).json({ error: "not found" });

  await db.delete(schema.locations).where(eq(schema.locations.id, req.params.id));
  res.status(204).send();
});
