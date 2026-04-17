import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Note } from "@/models/Note";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  const notes = await Note.find({ userId: session.user.email }).sort({ createdAt: -1 }).lean();
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
