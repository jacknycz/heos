import { Router } from "express";
import { z } from "zod";
import { toFile } from "openai";
import { requireAuth } from "../lib/auth";
import { getOpenAI } from "../lib/openai";
import { transcribeLimiter } from "../lib/rateLimit";

export const transcribeRouter = Router();
transcribeRouter.use(requireAuth);

// Voice input for the repair-log and driver-note forms: the app records a short clip and sends
// it here as a data URL (same pattern as receipt photos), rather than a multipart upload — no
// file ever touches disk.
const bodySchema = z.object({ audio: z.string().startsWith("data:audio/") });

// Whisper infers the audio format from the filename extension, and native vs. web recordings
// arrive with different mime types (m4a on iOS/Android, webm on web) — so the extension has to
// follow whatever the client actually sent, not a single hardcoded one.
const EXTENSION_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
};

transcribeRouter.post("/", transcribeLimiter, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const [header, base64 = ""] = parsed.data.audio.split(",");
  const mime = header.slice("data:".length).split(";")[0];
  const extension = EXTENSION_BY_MIME[mime] ?? "m4a";
  const buffer = Buffer.from(base64, "base64");
  const file = await toFile(buffer, `voice-note.${extension}`);

  const transcription = await getOpenAI().audio.transcriptions.create({ file, model: "whisper-1" });
  res.json({ text: transcription.text.trim() });
});
