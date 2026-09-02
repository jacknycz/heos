import OpenAI from "openai";

// Constructed lazily so a missing OPENAI_API_KEY only breaks the chat routes that need it,
// not the whole server (the OpenAI SDK throws at construction time if no key is set).
let client: OpenAI | null = null;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
