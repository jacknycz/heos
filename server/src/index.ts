import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { machinesRouter } from "./routes/machines";
import { repairLogsRouter } from "./routes/repairLogs";
import { driverNotesRouter } from "./routes/driverNotes";
import { hoursEntriesRouter } from "./routes/hoursEntries";
import { diagnosticsRouter } from "./routes/diagnostics";
import { partsRouter } from "./routes/parts";
import { chatRouter } from "./routes/chat";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/machines", machinesRouter);
app.use("/repair-logs", repairLogsRouter);
app.use("/driver-notes", driverNotesRouter);
app.use("/hours-entries", hoursEntriesRouter);
app.use("/diagnostics", diagnosticsRouter);
app.use("/parts", partsRouter);
app.use("/chat", chatRouter);

// Catches errors from any route (including async ones, via express-async-errors) so a bad
// request returns a 500 instead of crashing the whole server for every other user.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`HEOS server listening on :${port}`));
