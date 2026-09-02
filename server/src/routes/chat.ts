import { Router } from "express";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { getMachinePassport, machineContextToPrompt } from "../lib/machineContext";
import { getOpenAI, CHAT_MODEL } from "../lib/openai";

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

  const [thread] = await db.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, req.params.id));
  if (!thread) return res.status(404).json({ error: "not found" });

  const [userMessage] = await db
    .insert(schema.chatMessages)
    .values({ threadId: thread.id, role: parsed.data.role, content: parsed.data.content })
    .returning();

  if (parsed.data.role !== "user") return res.status(201).json([userMessage]);

  const [passport, priorMessages] = await Promise.all([
    getMachinePassport(thread.machineId),
    db.select().from(schema.chatMessages).where(eq(schema.chatMessages.threadId, thread.id)).orderBy(asc(schema.chatMessages.createdAt)),
  ]);
  if (!passport) return res.status(201).json([userMessage]);

  let reply: string;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: machineContextToPrompt(passport) },
        ...priorMessages.map((m) => ({ role: m.role, content: m.content }) as const),
      ],
    });
    reply = completion.choices[0]?.message?.content?.trim() || "Sorry, I didn't get a response — try again.";
  } catch (err) {
    console.error("OpenAI chat completion failed:", err);
    return res.status(502).json({ error: "chat assistant is unavailable right now", userMessage });
  }

  const [assistantMessage] = await db
    .insert(schema.chatMessages)
    .values({ threadId: thread.id, role: "assistant", content: reply })
    .returning();

  res.status(201).json([userMessage, assistantMessage]);
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
