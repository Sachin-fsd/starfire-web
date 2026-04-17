import { NextResponse } from "next/server";
import { getGmailClient } from "@/lib/google-apis";

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();
  const gmail = await getGmailClient();
  const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const response = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return NextResponse.json({ messageId: response.data.id });
}
