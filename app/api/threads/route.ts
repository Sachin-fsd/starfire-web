import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (threadId) {
    return NextResponse.json(await Thread.findOne({ _id: threadId, userId: session.user.email }).lean());
  }

  return NextResponse.json(await Thread.find({ userId: session.user.email }).sort({ createdAt: -1 }).lean());
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  const thread = await Thread.create({ ...(await req.json()), userId: session.user.email });
  return NextResponse.json(thread, { status: 201 });
}
