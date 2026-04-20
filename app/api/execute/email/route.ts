import { NextResponse } from "next/server";
import { getGmailClient } from "@/lib/google-apis";

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json();
    const gmail = await getGmailClient();

    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ].join("\r\n");

    const raw = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    if (response.status !== 200) {
      console.error("Gmail API returned non-200 status", response.status, response.data);
      return NextResponse.json(
        { error: "Gmail API did not accept the message", details: response.data },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Email request accepted", messageId: response.data.id });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
