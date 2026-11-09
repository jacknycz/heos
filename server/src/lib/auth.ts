import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db, schema } from "../db";

export type Role = "ADMIN" | "MANAGER" | "MECHANIC" | "DRIVER";

export type AuthUser = { id: string; organizationId: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// The token only carries the user id — organizationId and (especially) role are looked up fresh
// on every request in requireAuth, so an admin's role change takes effect immediately instead of
// waiting for the affected user's next login.
export function signAuthToken(user: { id: string }) {
  return jwt.sign({ id: user.id }, getJwtSecret(), { expiresIn: "30d" });
}

// Attaches req.user from a valid "Authorization: Bearer <token>" header, or 401s.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return res.status(401).json({ error: "missing bearer token" });

  let payload: { id: string };
  try {
    payload = jwt.verify(token, getJwtSecret()) as { id: string };
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.id));
  if (!user) return res.status(401).json({ error: "user not found" });

  req.user = { id: user.id, organizationId: user.organizationId, role: user.role };
  next();
}

// Must run after requireAuth. Only an org ADMIN may manage other users' roles/invites.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "admin role required" });
  next();
}

// Must run after requireAuth. Gates a route to a specific set of roles — for actions that
// should be more open than requireAdmin (e.g. mechanics logging repairs) but still shouldn't be
// callable by every authenticated user regardless of role.
export function requireRole(...roles: Role[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `requires role: ${roles.join(" or ")}` });
    }
    next();
  };
}
