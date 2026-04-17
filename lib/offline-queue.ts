"use client";

import { appDb } from "@/lib/indexeddb";

export async function enqueueAction(action: unknown) {
  const db = await appDb();
  await db.add("queue", { action, createdAt: Date.now() });
}
