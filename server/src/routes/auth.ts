import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { hashPassword, verifyPassword, signAuthToken, requireAuth } from "../lib/auth";

export const authRouter = Router();

function userResponse(user: typeof schema.users.$inferSelect) {
  return { id: user.id, organizationId: user.organizationId, name: user.name, email: user.email, role: user.role };
}

// Bootstraps a brand-new organization with its first (and initially only) admin.
authRouter.post("/signup-organization", async (req, res) => {
  const schemaValidator = z.object({
    organizationName: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (existing) return res.status(409).json({ error: "email already in use" });

  const [organization] = await db.insert(schema.organizations).values({ name: parsed.data.organizationName }).returning();
  const [user] = await db
    .insert(schema.users)
    .values({
      organizationId: organization.id,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ADMIN",
    })
    .returning();

  res.status(201).json({ token: signAuthToken({ id: user.id }), user: userResponse(user) });
});

authRouter.post("/login", async (req, res) => {
  const schemaValidator = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  res.json({ token: signAuthToken({ id: user.id }), user: userResponse(user) });
});

// Joins the organization behind a still-valid, unused invite code.
authRouter.post("/accept-invite", async (req, res) => {
  const schemaValidator = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [invite] = await db.select().from(schema.orgInvites).where(eq(schema.orgInvites.code, parsed.data.code));
  if (!invite) return res.status(404).json({ error: "invite not found" });
  if (invite.usedAt) return res.status(410).json({ error: "invite already used" });
  if (invite.expiresAt.getTime() < Date.now()) return res.status(410).json({ error: "invite expired" });

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (existing) return res.status(409).json({ error: "email already in use" });

  const [user] = await db
    .insert(schema.users)
    .values({
      organizationId: invite.organizationId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: invite.role,
    })
    .returning();

  await db.update(schema.orgInvites).set({ usedAt: new Date(), usedByUserId: user.id }).where(eq(schema.orgInvites.id, invite.id));

  res.status(201).json({ token: signAuthToken({ id: user.id }), user: userResponse(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.user!.id));
  if (!user) return res.status(404).json({ error: "not found" });
  const [organization] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, user.organizationId));
  res.json({ ...userResponse(user), organizationName: organization?.name });
});
