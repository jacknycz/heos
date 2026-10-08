import { Router } from "express";
import { z } from "zod";
import { toFile } from "openai";
import { requireAuth } from "../lib/auth";
import { getOpenAI } from "../lib/openai";

export const transcribeRouter = Router();
transcribeRouter.use(requireAuth);

// Voice input for the repair-log and driver-note forms: the app records a short clip and sends
// it here as a data URL (same pattern as receipt photos), rather than a multipart upload — no
// file ever touches disk.
const bodySchema = z.object({ audio: z.string().startsWith("data:audio/") });

transcribeRouter.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const base64 = parsed.data.audio.split(",")[1] ?? "";
  const buffer = Buffer.from(base64, "base64");
  const file = await toFile(buffer, "voice-note.m4a");

  const transcription = await getOpenAI().audio.transcriptions.create({ file, model: "whisper-1" });
  res.json({ text: transcription.text.trim() });
});
