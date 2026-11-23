import { Router } from "express";
import { z } from "zod";
import { and, eq, gt, isNull, sql, TransactionRollbackError } from "drizzle-orm";
import { db, schema } from "../db";
import { hashPassword, verifyPassword, signAuthToken, requireAuth } from "../lib/auth";

export const authRouter = Router();

// Emails are stored and matched case-insensitively — "Dana@x" and "dana@x" are the same
// account, since real-world mail systems treat them that way regardless of what RFC 5321
// technically permits. Normalizing on both write and read keeps the unique constraint and
// every lookup in agreement.
const emailSchema = z.string().email().trim().toLowerCase();

function userResponse(user: typeof schema.users.$inferSelect) {
  return { id: user.id, organizationId: user.organizationId, name: user.name, email: user.email, role: user.role };
}

// Bootstraps a brand-new organization with its first (and initially only) admin.
authRouter.post("/signup-organization", async (req, res) => {
  const schemaValidator = z.object({
    organizationName: z.string().min(1),
    name: z.string().min(1),
    email: emailSchema,
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
  const schemaValidator = z.object({ email: emailSchema, password: z.string().min(1) });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (!user || user.disabledAt || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  res.json({ token: signAuthToken({ id: user.id }), user: userResponse(user) });
});

// Joins the organization behind a still-valid, unused invite code.
authRouter.post("/accept-invite", async (req, res) => {
  const schemaValidator = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    email: emailSchema,
    password: z.string().min(8),
  });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  // Codes are shown uppercase; accept them however they're typed (and tolerate spaces/dashes).
  // Comparing on upper(code) also keeps older lowercase-hex codes redeemable until they expire.
  const code = parsed.data.code.replace(/[\s-]/g, "").toUpperCase();
  const passwordHash = await hashPassword(parsed.data.password);

  const result = await db
    .transaction(async (tx) => {
      // Claim the invite atomically: only one request can flip used_at from null, so two
      // concurrent redemptions of the same code can't both create an account.
      const [invite] = await tx
        .update(schema.orgInvites)
        .set({ usedAt: new Date() })
        .where(and(sql`upper(${schema.orgInvites.code}) = ${code}`, isNull(schema.orgInvites.usedAt), gt(schema.orgInvites.expiresAt, new Date())))
        .returning();
      if (!invite) return { error: "invalid" as const };

      const [existing] = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, parsed.data.email));
      if (existing) {
        tx.rollback();
      }

      const [user] = await tx
        .insert(schema.users)
        .values({ organizationId: invite.organizationId, name: parsed.data.name, email: parsed.data.email, passwordHash, role: invite.role })
        .returning();
      await tx.update(schema.orgInvites).set({ usedByUserId: user.id }).where(eq(schema.orgInvites.id, invite.id));
      return { user };
    })
    .catch((err: unknown) => {
      if (err instanceof TransactionRollbackError) return { error: "email" as const };
      throw err;
    });

  // One response for unknown, used and expired codes alike, so the endpoint can't be used to
  // confirm which codes exist.
  if ("error" in result) {
    return result.error === "invalid"
      ? res.status(404).json({ error: "invalid or expired invite code" })
      : res.status(409).json({ error: "email already in use" });
  }

  res.status(201).json({ token: signAuthToken({ id: result.user.id }), user: userResponse(result.user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.user!.id));
  if (!user) return res.status(404).json({ error: "not found" });
  const [organization] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, user.organizationId));
  res.json({ ...userResponse(user), organizationName: organization?.name });
});
