import { Router } from "express";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth, requireAdmin } from "../lib/auth";

export const usersRouter = Router();
usersRouter.use(requireAuth);

const ROLES = ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"] as const;

// Teammates in the current user's organization.
usersRouter.get("/", async (req, res) => {
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.organizationId, req.user!.organizationId));
  res.json(rows);
});

// Self-registration of this device's Expo push token, called after the app gets notification
// permission — not admin-gated, every user registers their own.
usersRouter.patch("/me/push-token", async (req, res) => {
  const parsed = z.object({ pushToken: z.string().min(1).nullable() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  await db.update(schema.users).set({ pushToken: parsed.data.pushToken }).where(eq(schema.users.id, req.user!.id));
  res.json({ pushToken: parsed.data.pushToken });
});

// Admin-only: change any teammate's role, including another admin's.
usersRouter.patch("/:id/role", requireAdmin, async (req, res) => {
  const schemaValidator = z.object({ role: z.enum(ROLES) });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [target] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.id, req.params.id), eq(schema.users.organizationId, req.user!.organizationId)));
  if (!target) return res.status(404).json({ error: "not found" });

  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const admins = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.organizationId, req.user!.organizationId), eq(schema.users.role, "ADMIN")));
    if (admins.length <= 1) return res.status(409).json({ error: "organization must keep at least one admin" });
  }

  const [updated] = await db.update(schema.users).set({ role: parsed.data.role }).where(eq(schema.users.id, target.id)).returning();
  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
});

// Admin-only: mint a one-time code a new teammate can redeem via POST /auth/accept-invite.
usersRouter.post("/invites", requireAdmin, async (req, res) => {
  const schemaValidator = z.object({ role: z.enum(ROLES) });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [invite] = await db
    .insert(schema.orgInvites)
    .values({
      organizationId: req.user!.organizationId,
      code: randomBytes(4).toString("hex"),
      role: parsed.data.role,
      createdByUserId: req.user!.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();
  res.status(201).json(invite);
});

// Admin-only: see outstanding/past invites for the organization.
usersRouter.get("/invites", requireAdmin, async (req, res) => {
  const rows = await db.select().from(schema.orgInvites).where(eq(schema.orgInvites.organizationId, req.user!.organizationId));
  res.json(rows);
});
