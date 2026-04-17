import crypto from "node:crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function clean(value?: string | null) {
  if (!value) return "";
  return value.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
}

function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = clean(process.env[key]);
    if (value) return value;
  }
  return "";
}

function resolveAuthSecret() {
  const configured = firstEnv("AUTH_SECRET", "NEXTAUTH_SECRET");
  if (configured) return configured;

  // Prevent `MissingSecret` crashes in local/preview environments.
  // Replace with a strong secret in real deployments.
  return crypto.createHash("sha256").update("flowmind-fallback-secret-change-me").digest("hex");
}

const googleClientId = firstEnv("GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID");
const googleClientSecret = firstEnv("GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET");

async function refreshAccessToken(token: any) {
  try {
    const endpoint = "https://oauth2.googleapis.com/token";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token
      })
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      access_token: refreshed.access_token,
      expires_at: Math.floor(Date.now() / 1000 + refreshed.expires_in),
      refresh_token: refreshed.refresh_token ?? token.refresh_token
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/contacts.readonly",
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = account.expires_at;
        return token;
      }

      if (token.expires_at && Date.now() < token.expires_at * 1000) return token;
      if (!token.refresh_token) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.access_token;
      session.refreshToken = token.refresh_token;
      session.error = token.error;
      return session;
    }
  },
  session: { strategy: "jwt" }
});
