import { NextResponse } from "next/server";
import { getTasksClient } from "@/lib/google-apis";

export async function POST(req: Request) {
  const { title, notes } = await req.json();
  const tasks = await getTasksClient();
  const lists = await tasks.tasklists.list({ maxResults: 1 });
  const tasklist = lists.data.items?.[0]?.id;
  if (!tasklist) return NextResponse.json({ error: "No task list available" }, { status: 400 });

  const result = await tasks.tasks.insert({ tasklist, requestBody: { title, notes } });
  return NextResponse.json({ taskId: result.data.id });
}
