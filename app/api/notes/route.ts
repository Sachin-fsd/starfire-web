import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  const query: Record<string, string> = { userId: session.user.email };
  if (threadId) query.threadId = threadId;

  const notes = await Note.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  const payload = await req.json();
  const note = await Note.create({ ...payload, userId: session.user.email });
  return NextResponse.json(note, { status: 201 });
}
