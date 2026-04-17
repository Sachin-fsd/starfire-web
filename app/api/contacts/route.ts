import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { Contact } from "@/models/Contact";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  return NextResponse.json(await Contact.find({ userId: session.user.email }).lean());
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectMongo();
  const contact = await Contact.create({ ...(await req.json()), userId: session.user.email });
  return NextResponse.json(contact, { status: 201 });
}
