import { z } from "zod";

export const IntentSchema = z.object({
  thread: z.string().nullable(),
  threadId: z.string().nullable(),
  action: z.enum(["EMAIL", "NOTE", "CALENDAR", "TASK", "REMINDER", "SEARCH"]),
  recipients: z.array(z.object({ name: z.string(), email: z.string().nullable() })),
  subject: z.string().nullable(),
  body: z.string(),
  datetime: z.string().nullable(),
  noteDestination: z.enum(["local", "google_tasks", "both"]),
  confidence: z.number().min(0).max(1),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().nullable()
});

export type IntentPayload = z.infer<typeof IntentSchema>;
