import { NextResponse } from "next/server";
import { parseIntentWithGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { transcript, profile } = await req.json();
    const intent = await parseIntentWithGemini(transcript, profile ?? {});
    return NextResponse.json(intent);
  } catch {
    return NextResponse.json({ error: "Unable to parse intent." }, { status: 400 });
  }
}
