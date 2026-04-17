import { Schema, model, models } from "mongoose";

const ContactSchema = new Schema(
  {
    threadId: { type: Schema.Types.ObjectId, required: true, ref: "Thread" },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    role: String,
    relationshipPriority: { type: String, enum: ["primary", "secondary"], default: "secondary" },
    notes: String
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Contact = models.Contact ?? model("Contact", ContactSchema);
