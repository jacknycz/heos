import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { locationsRouter } from "./routes/locations";
import { machinesRouter } from "./routes/machines";
import { repairLogsRouter } from "./routes/repairLogs";
import { driverNotesRouter } from "./routes/driverNotes";
import { hoursEntriesRouter } from "./routes/hoursEntries";
import { diagnosticsRouter } from "./routes/diagnostics";
import { partsRouter } from "./routes/parts";
import { milestonesRouter } from "./routes/milestones";
import { chatRouter } from "./routes/chat";
import { transcribeRouter } from "./routes/transcribe";
import { authLimiter } from "./lib/rateLimit";

const app = express();
// Railway terminates requests at one edge proxy, so the client's real IP is the last hop in
// X-Forwarded-For — rate limiting would otherwise see every request as coming from the proxy.
app.set("trust proxy", 1);
app.use(cors());
// Receipt photos and voice clips arrive as base64 data URLs, too big for the default 100kb, so
// only those two routes get a larger limit. Everything else, including the unauthenticated
// /auth routes, keeps the default. These must be mounted before the general parser below: a
// body already parsed here is skipped there, instead of being rejected at 100kb.
app.use(["/parts", "/transcribe"], express.json({ limit: "10mb" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(["/auth/login", "/auth/signup-organization", "/auth/accept-invite"], authLimiter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/locations", locationsRouter);
app.use("/machines", machinesRouter);
app.use("/repair-logs", repairLogsRouter);
app.use("/driver-notes", driverNotesRouter);
app.use("/hours-entries", hoursEntriesRouter);
app.use("/diagnostics", diagnosticsRouter);
app.use("/parts", partsRouter);
app.use("/milestones", milestonesRouter);
app.use("/chat", chatRouter);
app.use("/transcribe", transcribeRouter);

// Catches errors from any route (including async ones, via express-async-errors) so a bad
// request returns a 500 instead of crashing the whole server for every other user.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Client errors raised by express itself (an oversized body is 413, malformed JSON is 400)
  // carry their own status and are safe to show; anything else is a real server failure.
  const status = typeof err === "object" && err !== null && "status" in err ? Number(err.status) : 500;
  if (status >= 400 && status < 500) return res.status(status).json({ error: status === 413 ? "request too large" : "invalid request body" });
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`HEOS server listening on :${port}`));
