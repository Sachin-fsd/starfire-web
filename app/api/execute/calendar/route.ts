import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google-apis";

export async function POST(req: Request) {
  const { summary, description, start, end } = await req.json();
  const calendar = await getCalendarClient();
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: { summary, description, start: { dateTime: start }, end: { dateTime: end } }
  });
  return NextResponse.json({ eventId: response.data.id });
}
