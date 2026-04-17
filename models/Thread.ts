import { Schema, model, models } from "mongoose";

const ThreadSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    emoji: String,
    colorHex: String,
    keywords: { type: [String], default: [] },
    subjectTags: { type: [String], default: [] },
    category: { type: String, enum: ["work", "personal", "education", "health", "creative", "other"], default: "other" },
    lastUsedAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Thread = models.Thread ?? model("Thread", ThreadSchema);
