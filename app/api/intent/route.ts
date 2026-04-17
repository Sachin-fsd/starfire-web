import { NextResponse } from "next/server";
import { parseIntentWithGemini } from "@/lib/gemini";

function fallbackIntent(transcript: string) {
  return {
    thread: null,
    threadId: null,
    action: "NOTE",
    recipients: [],
    subject: null,
    body: transcript,
    datetime: null,
    noteDestination: "local",
    confidence: 0.6,
    clarificationNeeded: false,
    clarificationQuestion: null
  };
}

export async function POST(req: Request) {
  try {
    const { transcript, profile } = await req.json();
    const text = String(transcript ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    try {
      const intent = await parseIntentWithGemini(text, profile ?? {});
      return NextResponse.json(intent);
    } catch {
      return NextResponse.json(fallbackIntent(text));
    }
  } catch {
    return NextResponse.json({ error: "Unable to parse intent." }, { status: 400 });
  }
}
