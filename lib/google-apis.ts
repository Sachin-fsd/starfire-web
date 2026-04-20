import { google } from "googleapis";
import { auth } from "@/lib/auth";

async function oauthClient() {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Unauthenticated");
  }
  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken
  });
  return client;
}

export async function getGmailClient() {
  return google.gmail({ version: "v1", auth: await oauthClient() });
}

export async function getCalendarClient() {
  return google.calendar({ version: "v3", auth: await oauthClient() });
}

export async function getTasksClient() {
  return google.tasks({ version: "v1", auth: await oauthClient() });
}

export async function getContactsClient() {
  return google.people({ version: "v1", auth: await oauthClient() });
}
