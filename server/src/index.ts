import express from "express";
import cors from "cors";
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

app.use("/machines", machinesRouter);
app.use("/repair-logs", repairLogsRouter);
app.use("/driver-notes", driverNotesRouter);
app.use("/hours-entries", hoursEntriesRouter);
app.use("/diagnostics", diagnosticsRouter);
app.use("/parts", partsRouter);
app.use("/chat", chatRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`HEOS server listening on :${port}`));
