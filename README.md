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

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
## Fix for `Error 401: invalid_client` (Google sign-in)

If you see `invalid_client`, it is almost always **client ID/secret mismatch**, not redirect URI.

Checklist:

1. In `.env.local`, make sure the value pair comes from the **same OAuth client**:
   - `GOOGLE_CLIENT_ID=...apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET=...`
2. Avoid quotes/spaces/newlines in values.
3. Restart Next.js after changing `.env.local`.
4. In Google Cloud Console OAuth client, keep these exact local values:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. If you rotated secret and lost the old full value, create a **new secret**, copy it immediately, and use that latest secret in `.env.local`.

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
## Google APIs + quota model

- Yes, you must enable Gmail/Calendar/Tasks/People APIs in **your** Google Cloud project once.
- Users do **not** provide API keys; they grant OAuth consent and your backend uses their user token.
- Quotas are mixed:
  - Some limits are project-level (your app/project quota).
  - Some limits are per-user/per-mailbox actions.
- If adoption grows, request quota increases in Google Cloud Console.
