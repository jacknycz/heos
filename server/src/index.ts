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
// Default 100kb is too small for a receipt photo posted as a base64 data URL.
app.use(express.json({ limit: "10mb" }));

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
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`HEOS server listening on :${port}`));
