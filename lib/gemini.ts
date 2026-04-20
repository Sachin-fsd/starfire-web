"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { IntentSchema, type IntentPayload } from "@/lib/zod-schemas";

// --- GROQ SETUP ---
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// --- GEMINI SETUP ---
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { 
      responseMimeType: "application/json", // Forces Gemini to return pure JSON
    }
  });
}

export async function parseIntentWithAi(transcript: string, profileContext: unknown): Promise<IntentPayload> {
  const currentDate = new Date().toISOString().split('T')[0];

  // Shared instructions for both AI models
  const systemPrompt = `You are a personal assistant AI. Analyze the user's spoken request.
  
Current date is ${currentDate}. Use this to interpret relative dates like "tomorrow", "next week", etc. Always return future dates for calendar events and tasks.

If the user's request is a greeting, casual conversation, or not a task (like "hi", "hello", "how are you"),or if you need to ask about something to user, set action to "CHAT" and body to a friendly response, then ask about tasks.

If the request is for an email and the recipient address/body/subject is missing or unclear, set action to "CHAT" and set clarificationNeeded to true. Use clarificationQuestion to ask for the missing recipient or subject. Once you get all details for the email, set action to "EMAIL" and return with proper data.

If the request is for a calendar event and the date or time is missing or ambiguous, set action to "CHAT" and set clarificationNeeded to true. Use clarificationQuestion to ask for the missing date/time. Once you get all details for the calendar event, set action to "CALENDAR" and return with proper data.

If the request is for a task or reminder and the due date is missing, set clarificationNeeded to true and ask for the date/time. If the user wants to create a task, set action to "TASK". If the user wants to create a reminder, set action to "Calender".

If confidence is below 0.75, set clarificationNeeded to true and action to "CHAT" and write a short, friendly clarificationQuestion.
If you have any question then set action to "CHAT" and body to a friendly response, then ask about tasks. do not set action to anything else if you have any question.

USER PROFILE CONTEXT:${JSON.stringify(profileContext)}

expected return json 
{
  thread: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
  action: z.enum(["EMAIL", "NOTE", "CALENDAR", "TASK", "REMINDER", "SEARCH", "CHAT"]),
  recipients: z.array(z.object({ name: z.string(), email: z.string().nullable() })).optional(),
  subject: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  datetime: z.string().nullable().optional(),
  noteDestination: z.enum(["local", "google_tasks", "both"]).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().nullable().optional()
}

CRITICAL: You must return ONLY a raw JSON object. Do not include markdown code blocks (\`\`\`json) or any other text.`;

  // ==========================================
  // ATTEMPT 1: Google Gemini (Primary)
  // ==========================================
  try {
    const model = getGeminiModel();
    const prompt = `SYSTEM:\n${systemPrompt}\n\nUSER SAID:\n"${transcript}"`;
    
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    const rawObject = JSON.parse(text);
    console.log("Parsed via Gemini:", rawObject);
    return IntentSchema.parse(rawObject);

  } catch (geminiError) {
    console.warn("Gemini API failed, falling back to Groq. Error:", geminiError);

    // ==========================================
    // ATTEMPT 2: Groq (Fallback)
    // ==========================================
    try {
      const { text } = await generateText({
        model: groq("llama-3.1-8b-instant"),
        system: systemPrompt,
        prompt: transcript,
        temperature: 0.1,
      });

      const rawObject = JSON.parse(text);
      console.log("Parsed via Groq (Fallback):", rawObject);
      return IntentSchema.parse(rawObject);

    } catch (groqError) {
      // If both fail, we throw an error back to the frontend
      console.error("Both Gemini and Groq APIs failed.");
      console.error("Groq Error details:", groqError);
      throw new Error("Failed to parse intent due to AI provider outages.");
    }
  }
}