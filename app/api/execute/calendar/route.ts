import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google-apis";

function normalizeEventDateTime(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date/time value");
  }
  return date.toISOString();
}

export async function POST(req: Request) {
  try {
    const { summary, description, start, end, attendees } = await req.json();
    if (!start || !end) {
      return NextResponse.json({ error: "Start and end date/time are required." }, { status: 400 });
    }

    const calendar = await getCalendarClient();
    const normalizedStart = normalizeEventDateTime(start);
    const normalizedEnd = normalizeEventDateTime(end);

    if (new Date(normalizedEnd).getTime() <= new Date(normalizedStart).getTime()) {
      return NextResponse.json({ error: "End time must be after the start time." }, { status: 400 });
    }

    const event: any = {
      summary,
      description,
      start: { dateTime: normalizedStart },
      end: { dateTime: normalizedEnd }
    };

    if (attendees && attendees.length > 0) {
      event.attendees = attendees;
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event
    });

    console.log("Calendar event created successfully:", {
      eventId: response.data.id,
      summary: event.summary,
      start: event.start.dateTime,
      end: event.end.dateTime,
      link: response.data.htmlLink
    });

    return NextResponse.json({ eventId: response.data.id, link: response.data.htmlLink });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 });
  }
}
