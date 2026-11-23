import { rateLimit } from "express-rate-limit";

const MINUTE = 60 * 1000;

// Per-IP cap on the unauthenticated credential endpoints (login, org signup, invite
// redemption): plenty for real users, but it stops password guessing and invite-code guessing
// from being scriptable. Kept fairly loose because a whole yard can share one IP behind NAT.
export const authLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "too many attempts, try again in a few minutes" },
});
