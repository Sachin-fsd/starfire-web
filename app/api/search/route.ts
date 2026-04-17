import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { ActionLog } from "@/models/ActionLog";
import { Thread } from "@/models/Thread";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  await connectMongo();

  const [notes, actions, threads] = await Promise.all([
    Note.find({ userId: session.user.email, content: { $regex: query, $options: "i" } }).limit(10).lean(),
    ActionLog.find({ userId: session.user.email, transcript: { $regex: query, $options: "i" } }).limit(10).lean(),
    Thread.find({ userId: session.user.email, name: { $regex: query, $options: "i" } }).limit(10).lean()
  ]);

  return NextResponse.json({
    query,
    summary: `Found ${notes.length + actions.length + threads.length} matching records for “${query}”.`,
    results: { notes, actions, threads }
  });
}
