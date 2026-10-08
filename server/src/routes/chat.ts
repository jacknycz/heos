import { Router } from "express";
import { z } from "zod";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "../db";
import { getMachinePassport, machineContextToPrompt, assertMachineInOrg } from "../lib/machineContext";
import { getOpenAI, CHAT_MODEL } from "../lib/openai";
import { requireAuth } from "../lib/auth";

export const chatRouter = Router();
chatRouter.use(requireAuth);

// The machine's ongoing thread + its messages, so opening chat resumes where you left off
// instead of silently starting a new, empty thread every time (what the old standalone chat
// screen did — threadId only ever lived in that screen's local state).
chatRouter.get("/threads", async (req, res) => {
  const machineId = req.query.machineId;
  if (typeof machineId !== "string") return res.status(400).json({ error: "machineId is required" });
  if (!(await assertMachineInOrg(machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }

  const [thread] = await db
    .select()
    .from(schema.chatThreads)
    .where(eq(schema.chatThreads.machineId, machineId))
    .orderBy(desc(schema.chatThreads.createdAt))
    .limit(1);
  if (!thread) return res.json(null);

  const messages = await db
    .select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.threadId, thread.id))
    .orderBy(asc(schema.chatMessages.createdAt));
  res.json({ ...thread, messages });
});

// Opens a chat thread already primed with the machine's passport context — no manual re-entry.
chatRouter.post("/threads", async (req, res) => {
  const schemaValidator = z.object({ machineId: z.string() });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  if (!(await assertMachineInOrg(parsed.data.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "machine not found" });
  }
  const [thread] = await db
    .insert(schema.chatThreads)
    .values({ machineId: parsed.data.machineId, userId: req.user!.id })
    .returning();
  res.status(201).json(thread);
});

chatRouter.post("/threads/:id/messages", async (req, res) => {
  const schemaValidator = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) });
  const parsed = schemaValidator.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [thread] = await db.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, req.params.id));
  if (!thread || !(await assertMachineInOrg(thread.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [userMessage] = await db
    .insert(schema.chatMessages)
    .values({ threadId: thread.id, role: parsed.data.role, content: parsed.data.content })
    .returning();

  if (parsed.data.role !== "user") return res.status(201).json([userMessage]);

  const [passport, priorMessages] = await Promise.all([
    getMachinePassport(thread.machineId, req.user!.organizationId),
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

const SUMMARY_SYSTEM_PROMPT =
  "You write factual maintenance-log entries summarizing an AI chat conversation about a machine. " +
  "Write in third person, past tense, as a concise factual record — not a reply to anyone, and never " +
  'use "you"/"I". Cover what was discussed: symptoms or issues raised, diagnoses or advice given, ' +
  "and any actions recommended or taken. 2-4 sentences. If nothing substantive was discussed, say so briefly.";

// "Save Summary" from the Chat tab — folds every message since the last summary (or the whole
// thread, if none exists yet) into one third-person log entry that shows up in History. Not
// automatic (no scheduler in this project); explicit button tap only.
chatRouter.post("/threads/:id/summary", async (req, res) => {
  const [thread] = await db.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, req.params.id));
  if (!thread || !(await assertMachineInOrg(thread.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [lastSummary] = await db
    .select()
    .from(schema.chatSummaries)
    .where(eq(schema.chatSummaries.threadId, thread.id))
    .orderBy(desc(schema.chatSummaries.createdAt))
    .limit(1);

  // Deliberately not a timestamp comparison: Postgres timestamps carry microsecond precision,
  // a JS Date only holds milliseconds, and a message's own stored value is always a few
  // microseconds past the truncated copy of itself — so "createdAt > lastCoveredTimestamp" would
  // silently re-match the same boundary message on every call. Slicing by array position after
  // fetching messages in DB order sidesteps that entirely.
  const allMessages = await db
    .select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.threadId, thread.id))
    .orderBy(asc(schema.chatMessages.createdAt));

  const cutoffIndex = lastSummary ? allMessages.findIndex((m) => m.id === lastSummary.coveredThroughMessageId) : -1;
  const newMessages = cutoffIndex === -1 ? allMessages : allMessages.slice(cutoffIndex + 1);

  if (newMessages.length === 0) {
    return res.status(400).json({ error: "No new messages to summarize since the last summary." });
  }

  const transcript = newMessages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");

  let summaryText: string;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: `Summarize this maintenance chat conversation:\n\n${transcript}` },
      ],
    });
    summaryText = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    console.error("OpenAI chat summary failed:", err);
    return res.status(502).json({ error: "chat summary is unavailable right now" });
  }
  if (!summaryText) return res.status(502).json({ error: "chat summary is unavailable right now" });

  const [summary] = await db
    .insert(schema.chatSummaries)
    .values({
      machineId: thread.machineId,
      threadId: thread.id,
      summary: summaryText,
      coveredThroughMessageId: newMessages[newMessages.length - 1].id,
    })
    .returning();

  res.status(201).json(summary);
});

// "Add this update to the record" — turns a chat exchange into a real repair/diagnostic/note entry.
chatRouter.post("/messages/:id/add-to-record", async (req, res) => {
  const [row] = await db
    .select({ message: schema.chatMessages, machineId: schema.chatThreads.machineId })
    .from(schema.chatMessages)
    .innerJoin(schema.chatThreads, eq(schema.chatThreads.id, schema.chatMessages.threadId))
    .where(eq(schema.chatMessages.id, req.params.id));
  if (!row || !(await assertMachineInOrg(row.machineId, req.user!.organizationId))) {
    return res.status(404).json({ error: "not found" });
  }

  const [message] = await db
    .update(schema.chatMessages)
    .set({ addedToRecord: true })
    .where(eq(schema.chatMessages.id, req.params.id))
    .returning();
  // Saved as-is for now; a later pass may extract structured repair logs from it.
  await db.insert(schema.aiLogs).values({ machineId: row.machineId, sourceMessageId: message.id, content: message.content });
  res.json(message);
});
