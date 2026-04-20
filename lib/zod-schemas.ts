import { z } from "zod";

export const IntentSchema = z.object({
  thread: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
  action: z.enum(["EMAIL", "NOTE", "CALENDAR", "TASK", "REMINDER", "SEARCH", "CHAT"]),
  recipients: z.array(z.object({ name: z.string(), email: z.string().nullable() })).optional(),
  subject: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  datetime: z.string().nullable().optional(),
  noteDestination: z.enum(["local", "google_tasks", "both"]).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().nullable().optional()
});

export type IntentPayload = z.infer<typeof IntentSchema>;
