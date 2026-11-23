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

// Per-user caps on the endpoints that spend OpenAI credit. Keyed on the signed-in user rather
// than IP, so one account can't run up the bill and a busy shared yard IP doesn't throttle
// everyone. Must be mounted after requireAuth.
function perUserLimiter(windowMs: number, limit: number, what: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => req.user!.id,
    message: { error: `too many ${what} requests, try again in a few minutes` },
  });
}

export const chatLimiter = perUserLimiter(10 * MINUTE, 40, "chat");
export const transcribeLimiter = perUserLimiter(10 * MINUTE, 30, "voice");
