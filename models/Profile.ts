import { Schema, model, models } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    avatarUrl: String,
    noteDestination: { type: String, enum: ["local", "google_tasks", "both"], default: "local" },
    dailyDigestTime: { type: String, default: "08:00" },
    autoApproveTypes: { type: [String], default: [] },
    timezone: { type: String, default: "UTC" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Profile = models.Profile ?? model("Profile", ProfileSchema);
