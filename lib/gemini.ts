"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { IntentSchema, type IntentPayload } from "@/lib/zod-schemas";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
}

export async function parseIntentWithGemini(transcript: string, profileContext: unknown): Promise<IntentPayload> {
  const prompt = `SYSTEM:\nYou are a personal assistant AI. Analyze the user request and return ONLY valid JSON.\n\nUSER PROFILE CONTEXT:\n${JSON.stringify(
    profileContext
  )}\n\nUSER SAID:\n"${transcript}"`;

  const response = await getModel().generateContent(prompt);
  const text = response.response.text();
  const parsed = JSON.parse(text);
  return IntentSchema.parse(parsed);
}
