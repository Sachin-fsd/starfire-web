import { Schema, model, models } from "mongoose";

const NoteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    threadId: { type: Schema.Types.ObjectId, ref: "Thread" },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    syncedToGoogleTasks: { type: Boolean, default: false },
    googleTaskId: String
  },
  { timestamps: true }
);

export const Note = models.Note ?? model("Note", NoteSchema);
