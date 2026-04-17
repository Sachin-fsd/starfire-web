import { Schema, model, models } from "mongoose";

const ActionLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    threadId: { type: Schema.Types.ObjectId, ref: "Thread" },
    type: { type: String, enum: ["EMAIL", "NOTE", "CALENDAR", "TASK", "REMINDER", "SEARCH"], required: true },
    transcript: String,
    parsedJson: Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "sent", "failed", "draft"], default: "pending" },
    externalId: String,
    sentAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActionLog = models.ActionLog ?? model("ActionLog", ActionLogSchema);
