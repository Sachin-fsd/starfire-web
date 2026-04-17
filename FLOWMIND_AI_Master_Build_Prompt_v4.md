## FlowMind AI — Master Build Prompt v4.0

**Role:** You are a Senior Full-Stack Web Architect and AI Engineer with deep expertise in Next.js 14 App Router, agentic AI systems, MongoDB, and Google API integrations.

**Task:** Design and implement a complete, production-ready Next.js 14 web application called **FlowMind AI** — a voice-first agentic personal assistant for anyone managing multiple ongoing life contexts simultaneously. The app must require zero manual API key configuration from the user. A user signs in with Google and immediately starts using every feature. That is the only onboarding step.

---

### 1. Project Philosophy

**Zero-friction capture** is the north star. A user opens the app, speaks one sentence, and the AI automatically routes it to the right context and executes the right action. No forms. No dropdowns. No category selection.

**Zero technical setup for users.** No API keys, no bot tokens, no third-party registrations. Every capability is powered exclusively by Google's APIs, which the user already authorizes during Google Sign-In. The developer stores a single set of server-side environment variables (Gemini API key, MongoDB URI). Users never see a settings page with text fields for tokens.

**Offline-first.** The app must work without an internet connection for note-taking, task creation, and voice capture. Data syncs automatically when connectivity returns. No spinners on the critical path.

---

### 2. Who This Is For

FlowMind is for **anyone managing multiple parallel life contexts** — a student juggling coursework and a part-time job, a researcher managing papers and lab meetings, a content creator running multiple brands, a parent coordinating family schedules, a doctor tracking patients and CME requirements. The concept of **"Threads"** means any named, ongoing context in the user's life. Not just work. Not just companies.

---

### 3. Authentication Architecture (Critical — Read First)

**Single Google OAuth flow handles everything.** When the user clicks "Sign in with Google", request all necessary scopes in one shot:

```text
openid
email
profile
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/contacts.readonly
```

Use **NextAuth.js v5** with the Google provider. Store the OAuth `access_token` and `refresh_token` in the NextAuth JWT. On each API route call, retrieve the token from the server session — never expose it to the browser. Implement silent token refresh using the `refresh_token` before every Google API call. If the token is expired and refresh fails, redirect the user to re-authenticate.

**Gemini API key:** Stored as a server-side environment variable `GEMINI_API_KEY` in `.env.local` (and in Vercel/Railway environment settings). It is called only from Next.js API routes — never from the client. Users never see or touch it.

**MongoDB URI:** Also a server-side environment variable `MONGODB_URI`. Never exposed to the client.

**Result:** The user's entire experience is: open app → click "Continue with Google" → grant permissions once → use everything immediately.

---

### 4. Core Feature Set

#### 4.1 Thread & Knowledge Base Manager

"Threads" are the user's named life contexts. Examples: `Work — Acme Corp`, `Study — Data Science MSc`, `Health — Fitness Goals`, `Family`, `Side Project — Podcast`.

Each thread document:

```javascript
{
  threadId, userId, name, description,
  emoji, colorHex,
  keywords: ["acme", "the startup", "work project"],
  subjectTags: ["marketing", "Q3", "budget"],
  category: "work" | "personal" | "education" | "health" | "creative" | "other",
  createdAt, updatedAt
}
```

Contacts per thread:

```javascript
{
  contactId, threadId, userId,
  name, email, phone, role,
  relationshipPriority: "primary" | "secondary",
  notes, createdAt
}
```

Thread keywords drive all fuzzy intent matching. If a thread named "Data Science MSc" has keywords `["the uni", "my course", "MSc"]`, then saying *"email my prof about the uni assignment"* resolves to that thread without the user specifying it.

#### 4.2 Voice-to-Action Pipeline

**Step 1 — Capture**

Use the **Web Speech API** (`SpeechRecognition`) for real-time in-browser voice transcription with zero API cost. This is the primary transcription method:

- Show a live animated waveform while recording (CSS/SVG animation, no library needed)
- Display the interim transcript in real time as the user speaks
- Auto-stop after 2.5 seconds of silence (monitor `onresult` and set a silence timer)
- Show a floating mic button, always visible, that pulses when active
- Provide a text input fallback for users who prefer typing or whose browser doesn't support Web Speech API
- Support two record modes: tap-to-toggle (tap once to start, tap again to stop) and hold-to-record (hold mic button)

**Browser compatibility note:** Web Speech API works in Chrome and Edge (covers ~70% of desktop users). For Firefox/Safari, fall back to displaying a text input automatically with a message: *"Your browser doesn't support voice input — type your request instead."* Do not use any paid transcription API.

**Step 2 — Intent Parsing**

After transcription, send to a Next.js API route (`/api/intent`) which calls **Gemini 2.0 Flash** (`gemini-2.0-flash-exp`, free tier). Never call Gemini from the client side.

The API route constructs this prompt:

```text
SYSTEM:
You are a personal assistant AI. Analyze the user's spoken request and return ONLY a valid JSON object. No markdown. No explanation. No code fences.

If confidence is below 0.75, set clarificationNeeded to true and write a short, friendly clarificationQuestion.

USER PROFILE CONTEXT:
${JSON.stringify(userProfile)}  // threads, contacts, last 5 actions

USER SAID:
"${transcript}"

Return exactly this JSON schema:
{
  "thread": string | null,
  "threadId": string | null,
  "action": "EMAIL" | "NOTE" | "CALENDAR" | "TASK" | "REMINDER" | "SEARCH",
  "recipients": [{ "name": string, "email": string | null }],
  "subject": string | null,
  "body": string,
  "datetime": "ISO8601 string" | null,
  "noteDestination": "local" | "google_tasks" | "both",
  "confidence": number (0.0 to 1.0),
  "clarificationNeeded": boolean,
  "clarificationQuestion": string | null
}
```

Validate the response with **Zod** before using it. If Gemini returns malformed JSON (rare), retry once. If it fails again, show the user a friendly error and let them rephrase.

**Step 3 — Clarification (Active Learning)**

If `clarificationNeeded: true`, show a **bottom drawer modal** with the AI's question. The user can answer by voice or text. Append the answer to the conversation, re-send to `/api/intent`, and loop until `clarificationNeeded: false`. Save any newly discovered contacts to MongoDB automatically.

**Step 4 — Action Preview**

Before executing any action that sends data externally (email, calendar event, task), show a full-screen preview card:

- Rendered preview of the email/event/task
- Three buttons: **Edit** (opens inline editor) | **Send** | **Save as Draft**
- Users can toggle "Auto-approve this action type" in settings to skip the preview for trusted action types

**Step 5 — Execution**

All execution happens in Next.js API routes using the user's Google OAuth token from their server session. Never execute from the client.

#### 4.3 Execution Layer — All Free, All Google

| Action | API Used | Endpoint |
|---|---|---|
| Send email | Gmail API (`gmail.send`) | `/api/execute/email` |
| Create calendar event | Google Calendar API | `/api/execute/calendar` |
| Create task / note | Google Tasks API | `/api/execute/task` |
| Save note locally | MongoDB + IndexedDB | `/api/notes` |
| Set reminder | Web Notifications API (browser) | client-side |
| Voice search | Gemini + MongoDB Atlas Search | `/api/search` |

**Notes architecture:** Notes are saved to MongoDB immediately (fast, offline-capable via IndexedDB queue). If the user has enabled "Sync to Google Tasks" in settings, the API route also creates a Task in their Google Tasks list. This is the only optional setting the user ever touches — a single toggle, not a key field.

**Email implementation:** The Gmail API `send` method accepts a base64-encoded RFC 2822 message. Build the message string server-side and send it using the user's OAuth token. The email appears as sent from the user's own Gmail account.

**Calendar implementation:** Use the Google Calendar API `events.insert` method. Default to the user's primary calendar. Parse natural language dates from the Gemini output (already in ISO8601).

**Google Tasks implementation:** Use the `tasks.insert` method on the user's default task list. Map FlowMind notes and tasks to Google Tasks so they appear in Gmail sidebar and Google Calendar natively.

#### 4.4 Notes — Local First, Google Tasks Optional

Notes follow a two-layer storage strategy:

1. **Immediate local save:** Write to MongoDB via `/api/notes`. Also write to browser IndexedDB for instant offline access. The note appears on screen within 100ms of the user's voice command completing.
2. **Optional Google Tasks sync:** If the user has toggled "Sync notes to Google Tasks" in settings (off by default), each note is also created as a Google Task. This is the only setting that requires user action.

Notes are rendered in a clean card feed, filterable by Thread. Full-text search is powered by MongoDB Atlas Search with a text index on the `content` field.

#### 4.5 Daily Digest

At a time the user sets (default: 8:00 AM), generate and deliver a daily briefing:

- Group yesterday's actions by Thread
- Surface: pending tasks, unresponded emails (tracked in action log), upcoming calendar events for today
- Use Gemini to write a 3–5 sentence natural language summary
- Deliver via **Web Push Notification** (using the Web Push API + VAPID keys stored as server env vars, fully free)
- Also display as the first card on the home screen dashboard when the user opens the app

Implement the digest generation as a **Next.js Cron Route** (`/api/cron/digest`) triggered by Vercel Cron Jobs (free on Vercel hobby plan, runs daily).

#### 4.6 Smart Search

A search bar is always visible in the top nav. Queries can be typed or spoken. The search API route:

1. Runs a MongoDB Atlas full-text search across `notes`, `actions_log`, and thread metadata
2. Passes results + the original query to Gemini for semantic ranking and a natural language summary answer
3. Returns both the ranked list of matching records and the summary

Example: *"What did I decide about the Q3 budget?"* returns matching notes and emails with a Gemini-written summary at the top.

#### 4.7 Thread Analytics

A dashboard page shows:

- Per-thread action counts (emails sent, notes created, tasks completed, meetings scheduled) as a bar chart using **Recharts** (free, no backend needed)
- A weekly activity heatmap (GitHub-style, built in plain SVG)
- A "most active thread" summary card
- Recent action timeline, grouped by day

---

### 5. Full Technical Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server components, API routes, cron jobs in one repo |
| Auth | NextAuth.js v5 (Auth.js) | Google OAuth, JWT session, token storage |
| AI — Intent | Gemini 2.0 Flash (`@google/generative-ai`) | Free tier, 1M context, fast |
| Voice — Primary | Web Speech API (browser built-in) | Free, no API call, real-time |
| Voice — Fallback | Text input | Universal fallback |
| Database — Cloud | MongoDB Atlas + Mongoose | Free 512MB, Atlas Search built-in |
| Database — Offline | IndexedDB (via `idb` library) | Browser offline store |
| Offline sync | Custom sync manager (service worker) | Queue actions, replay on reconnect |
| Styling | Tailwind CSS v3 | Utility-first, no runtime cost |
| UI components | shadcn/ui | Accessible, unstyled base components |
| Icons | Lucide React | Free, tree-shakeable |
| Charts | Recharts | Free, React-native charting |
| Animations | Framer Motion | Smooth, declarative |
| Schema validation | Zod | Runtime type safety on AI outputs |
| HTTP (server) | Native `fetch` (Node 18+) | No extra dependency |
| Deployment | Vercel (hobby plan) | Free, cron jobs included |
| Push notifications | Web Push API + VAPID | Free, no third-party service |
| Google APIs | `googleapis` npm package | Gmail, Calendar, Tasks, Contacts |

**Why MongoDB over a SQL database:** Each Thread, Contact, Note, and Action has a different, evolving shape. A thread's `keywords[]` array, a note's arbitrary `tags[]`, and a contact's optional fields all map naturally to documents without schema migrations. MongoDB Atlas Search provides full-text search across all collections without a separate service. The free tier (512MB) is ample for a personal assistant.

---

### 6. MongoDB Schema

```javascript
// profiles
{
  _id: ObjectId,
  userId: String,
  name: String,
  email: String,
  avatarUrl: String,
  noteDestination: "local" | "google_tasks" | "both",
  dailyDigestTime: String,
  autoApproveTypes: [String],
  timezone: String,
  createdAt: Date
}

// threads
{
  _id: ObjectId,
  userId: String,
  name: String,
  description: String,
  emoji: String,
  colorHex: String,
  keywords: [String],
  subjectTags: [String],
  category: "work"|"personal"|"education"|"health"|"creative"|"other",
  lastUsedAt: Date,
  createdAt: Date
}

// contacts
{
  _id: ObjectId,
  threadId: ObjectId,
  userId: String,
  name: String,
  email: String,
  phone: String,
  role: String,
  relationshipPriority: "primary"|"secondary",
  notes: String,
  createdAt: Date
}

// notes
{
  _id: ObjectId,
  userId: String,
  threadId: ObjectId,
  content: String,
  tags: [String],
  syncedToGoogleTasks: Boolean,
  googleTaskId: String,
  createdAt: Date,
  updatedAt: Date
}

// actions_log
{
  _id: ObjectId,
  userId: String,
  threadId: ObjectId,
  type: "EMAIL"|"NOTE"|"CALENDAR"|"TASK"|"REMINDER"|"SEARCH",
  transcript: String,
  parsedJson: Object,
  status: "pending"|"sent"|"failed"|"draft",
  externalId: String,
  createdAt: Date,
  sentAt: Date
}

// learned_facts
{
  _id: ObjectId,
  userId: String,
  threadId: ObjectId,
  factKey: String,
  factValue: String,
  sourceTranscript: String,
  createdAt: Date
}
```

Atlas Search index on `notes.content`, `actions_log.transcript`, and `threads.name` + `threads.keywords`.

---

### 7. Next.js App Router File Structure

```text
app/
  (auth)/
    login/page.tsx
  (app)/
    layout.tsx
    page.tsx
    threads/
      page.tsx
      [threadId]/page.tsx
    notes/page.tsx
    search/page.tsx
    analytics/page.tsx
    settings/page.tsx
  api/
    auth/[...nextauth]/route.ts
    intent/route.ts
    execute/
      email/route.ts
      calendar/route.ts
      task/route.ts
    notes/route.ts
    search/route.ts
    threads/route.ts
    contacts/route.ts
    cron/
      digest/route.ts
components/
  VoiceMic.tsx
  ActionPreview.tsx
  ClarificationDrawer.tsx
  ThreadCard.tsx
  NoteCard.tsx
  SearchBar.tsx
lib/
  mongodb.ts
  gemini.ts
  google-apis.ts
  speech.ts
  indexeddb.ts
  offline-queue.ts
  zod-schemas.ts
```

---

### 8. Implementation Roadmap

**Phase 1 — Auth & Shell (Days 1–3)**

- Next.js 14 project with Tailwind + shadcn/ui
- NextAuth.js v5 with Google provider, all scopes in one request
- MongoDB Atlas cluster + Mongoose models
- App shell: sidebar nav, header with search, floating mic button placeholder
- Profile creation on first login (auto-populated from Google account)

**Phase 2 — Voice & Intent (Days 4–7)**

- `VoiceMic.tsx` with Web Speech API, waveform animation, silence detection
- `/api/intent` route: Gemini 2.0 Flash call with Zod validation
- `ClarificationDrawer.tsx` for ambiguous intents
- Display parsed intent result card on home screen

**Phase 3 — Execution Layer (Days 8–12)**

- `/api/execute/email` using Gmail API with user OAuth token
- `/api/execute/calendar` using Google Calendar API
- `/api/execute/task` using Google Tasks API
- `ActionPreview.tsx` component with Edit / Send / Draft flow
- Notes saved to MongoDB + IndexedDB simultaneously

**Phase 4 — Offline & Search (Days 13–16)**

- IndexedDB write on every note/task creation
- Service worker offline queue: captures failed API calls, replays on reconnect
- Sync status indicator in header (green dot = synced, amber = pending, red = offline)
- `/api/search` with MongoDB Atlas Search + Gemini semantic ranking
- Search UI with voice query support

**Phase 5 — Polish & Analytics (Days 17–21)**

- Daily digest: Vercel Cron job + Web Push notification
- Analytics dashboard with Recharts bar chart + SVG heatmap
- Thread detail pages with full action history
- Settings page: note sync toggle, digest time picker
- Active learning: auto-save contacts discovered during clarification
- End-to-end testing of all voice → action flows

---

### 9. Key Implementation Details

**Protecting the Gemini key:** The `GEMINI_API_KEY` environment variable must only be read inside `/api/*` routes. Add `'use server'` where needed. Never import `lib/gemini.ts` from any client component.

**Token refresh pattern for Google APIs:**

```typescript
// lib/google-apis.ts
import { getServerSession } from "next-auth"
import { google } from "googleapis"

export async function getGmailClient() {
  const session = await getServerSession()
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  })
  return google.gmail({ version: "v1", auth: oauth2Client })
}
```

Use the same pattern for Calendar and Tasks — just swap the service name.

**IndexedDB offline queue pattern:**

```typescript
// If API call fails due to no network, write to IndexedDB queue
// On service worker 'sync' event (Background Sync API), replay queued actions
// Show count of pending actions in header sync indicator
```

**Web Speech API silence detection:**

```typescript
let silenceTimer: ReturnType<typeof setTimeout>
recognition.onresult = (e) => {
  clearTimeout(silenceTimer)
  transcript = Array.from(e.results).map(r => r[0].transcript).join("")
  silenceTimer = setTimeout(() => recognition.stop(), 2500)
}
```

**Zod schema for Gemini output:**

```typescript
const IntentSchema = z.object({
  thread: z.string().nullable(),
  threadId: z.string().nullable(),
  action: z.enum(["EMAIL","NOTE","CALENDAR","TASK","REMINDER","SEARCH"]),
  recipients: z.array(z.object({ name: z.string(), email: z.string().nullable() })),
  subject: z.string().nullable(),
  body: z.string(),
  datetime: z.string().nullable(),
  noteDestination: z.enum(["local","google_tasks","both"]),
  confidence: z.number().min(0).max(1),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().nullable(),
})
```

---

### 10. Environment Variables (`.env.local`)

```bash
# Auth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI (developer pays, users never see this)
GEMINI_API_KEY=

# Database (developer pays, users never see this)
MONGODB_URI=

# Web Push (generate with web-push npm package)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@yourdomain.com
```

That is the complete set. **Users configure nothing.** The developer sets these once in Vercel's environment settings and the app works for all users.

---

### 11. Google Cloud Console Setup Checklist

This is a one-time developer task, not a user task:

1. Create a project at `console.cloud.google.com`
2. Enable APIs: Gmail API, Google Calendar API, Tasks API, People API
3. Configure OAuth consent screen: set scopes for all four APIs, add your domain
4. Create OAuth 2.0 credentials (Web Application type), add `http://localhost:3000/api/auth/callback/google` as authorized redirect URI
5. Submit for Google verification if deploying publicly (required for Gmail/Calendar scopes with external users)
6. Copy Client ID and Secret to `.env.local`
7. Enable Gemini API at `aistudio.google.com`, copy key to `.env.local`
8. Create MongoDB Atlas free cluster, get connection string, copy to `.env.local`

---

### 12. Stretch Features (Post-MVP)

- **Gmail reply tracking:** Poll Gmail for replies to sent emails (using Gmail API `messages.list` with `q: "in:inbox"`) and surface them in the relevant Thread
- **Google Contacts import:** On first login, import the user's Google Contacts and suggest matching them to Threads
- **Recurring event detection:** If the user says "every Monday", parse recurrence rules and pass `recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO"]` to the Calendar API
- **Multi-language voice:** Web Speech API supports 50+ languages — add a language selector in settings, pass `recognition.lang = userLang` before starting
- **Notion integration (optional):** If a user provides a Notion integration token voluntarily (one optional power-user setting), sync notes to a Notion database via the free Notion API
- **PWA install prompt:** Add a Web App Manifest and service worker so users can install FlowMind to their home screen for an app-like experience

---

This prompt is complete, self-consistent, and contains no conflicting instructions. Paste it directly into any capable coding LLM (GPT-4o, Gemini, Claude) and ask it to generate the file structure and implementation for each phase sequentially. Start with Phase 1 and ask for the complete code for each file before moving to the next phase.
