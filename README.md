# FlowMind AI (Starter)

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill values:
   ```bash
   cp .env.example .env.local
   ```
3. Generate secret (paste into `AUTH_SECRET`):
   ```bash
   openssl rand -base64 32
   ```
4. Start app:
   ```bash
   npm run dev
   ```

## Fix for `[auth][error] MissingSecret`

That error means `AUTH_SECRET` (or `NEXTAUTH_SECRET`) was not set. Set it in `.env.local`.

## Google APIs + quota model

- Yes, you must enable Gmail/Calendar/Tasks/People APIs in **your** Google Cloud project once.
- Users do **not** provide API keys; they grant OAuth consent and your backend uses their user token.
- Quotas are mixed:
  - Some limits are project-level (your app/project quota).
  - Some limits are per-user/per-mailbox actions.
- If adoption grows, request quota increases in Google Cloud Console.
