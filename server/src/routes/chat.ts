import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

export const chatRouter = Router();

// Opens a chat thread already primed with the machine's passport context — no manual re-entry.
chatRouter.post("/threads", async (req, res) => {
  const schemaValidator = z.object({ machineId: z.string(), userId: z.string() });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const [thread] = await db.insert(schema.chatThreads).values(parsed.data).returning();
  res.status(201).json(thread);
});

chatRouter.post("/threads/:id/messages", async (req, res) => {
  const schemaValidator = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  // TODO: when role === "user", call the LLM provider with machine context injected
  // and persist the assistant's reply as a second message here.
  const [message] = await db
    .insert(schema.chatMessages)
    .values({ threadId: req.params.id, role: parsed.data.role, content: parsed.data.content })
    .returning();
  res.status(201).json(message);
});

// "Add this update to the record" — turns a chat exchange into a real repair/diagnostic/note entry.
chatRouter.post("/messages/:id/add-to-record", async (req, res) => {
  const [message] = await db
    .update(schema.chatMessages)
    .set({ addedToRecord: true })
    .where(eq(schema.chatMessages.id, req.params.id))
    .returning();
  if (!message) return res.status(404).json({ error: "not found" });
  // TODO: extraction step — turn message.content into a draft RepairLog/DriverNote for review before saving.
  res.json(message);
});
