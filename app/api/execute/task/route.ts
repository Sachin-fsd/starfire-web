import { NextResponse } from "next/server";
import { getTasksClient } from "@/lib/google-apis";

export async function POST(req: Request) {
  try {
    const { title, notes, dueDate } = await req.json();
    const tasks = await getTasksClient();
    const lists = await tasks.tasklists.list({ maxResults: 1 });
    const tasklist = lists.data.items?.[0]?.id;
    if (!tasklist) return NextResponse.json({ error: "No task list available" }, { status: 400 });

    const taskData: any = { title, notes };
    if (dueDate) taskData.due = dueDate;

    const result = await tasks.tasks.insert({ tasklist, requestBody: taskData });
    return NextResponse.json({ taskId: result.data.id });
  } catch (error) {
    console.error("Task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
