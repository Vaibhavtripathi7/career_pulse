# CareerPulse — Complete Architecture Reference

> Strict, source-accurate documentation of every system, flow, and decision in this codebase.
> Written for a model or engineer who needs to build on top of it with zero ambiguity.

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [Database Schema](#4-database-schema)
5. [Backend Entry Points & Express App](#5-backend-entry-points--express-app)
6. [Authentication Architecture](#6-authentication-architecture)
7. [API Routes Reference](#7-api-routes-reference)
8. [Gmail Sync Architecture](#8-gmail-sync-architecture)
9. [Parsing Architecture (Critical)](#9-parsing-architecture-critical)
10. [Email Classification & Lifecycle Engine](#10-email-classification--lifecycle-engine)
11. [Application Matching Engine](#11-application-matching-engine)
12. [Async Infrastructure: Cron + BullMQ + Worker](#12-async-infrastructure-cron--bullmq--worker)
13. [Utility Layer](#13-utility-layer)
14. [Frontend Architecture](#14-frontend-architecture)
15. [Infrastructure & Deployment](#15-infrastructure--deployment)
16. [Testing](#16-testing)
17. [Known Issues, Quirks & Dead Code](#17-known-issues-quirks--dead-code)
18. [Environment Variables](#18-environment-variables)
19. [End-to-End Data Flow Diagrams](#19-end-to-end-data-flow-diagrams)

---

## 1. What This System Does

CareerPulse is a **fully automated job application tracker**. Users sign in with Google, grant Gmail read access, and the system:

- Syncs their Gmail inbox to extract job application emails.
- Parses each email to identify the company, role, and work model.
- Deduplicates against existing records.
- Classifies follow-up emails (interview, rejection, offer) and **automatically advances the application status** through a defined lifecycle.
- Exposes this data on a dashboard with filtering, charts, and manual override capabilities.
- Runs background sync every 2 hours for every registered user via a BullMQ queue.

---

## 2. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript (ESM, `"type": "module"`) |
| Framework | Express 5 |
| ORM | Prisma 7 (`@prisma/adapter-pg` with pg Pool) |
| Database | PostgreSQL 15 |
| Queue | BullMQ 5 (backed by Redis) |
| Background Jobs | node-cron 4 |
| Auth | Google OAuth2 (`googleapis`), JWT (`jsonwebtoken`), httpOnly cookie |
| AI/LLM | Google Gemini 2.5 Flash Lite (`@google/generative-ai`) — *currently unused in prod path* |
| Logging | Pino (pretty in dev, JSON in prod, silent in test) |
| Validation | Zod 4 |
| Concurrency | p-limit 7 (max 2 concurrent Gmail API calls per sync) |
| Build | `tsc` → `dist/` |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts 3 |
| HTTP | Axios (withCredentials: true) |
| Animations | animejs 4 |
| Toasts | react-hot-toast |
| Deploy | Vercel (frontend only) |

---

## 3. Repository Layout

```
career_pulse/
├── src/                          # Backend source
│   ├── index.ts                  # ENTRY POINT — starts server + cron
│   ├── app.ts                    # Express app setup, route mounting
│   ├── db.ts                     # Prisma client (singleton, pg pool)
│   ├── email.worker.ts           # BullMQ worker definition
│   ├── middlewares/
│   │   └── auth.ts               # JWT cookie auth middleware
│   ├── routes/
│   │   ├── auth.ts               # /api/auth/* (Google OAuth + /me)
│   │   ├── sync.ts               # POST /api/sync (manual trigger)
│   │   ├── application.ts        # GET/POST/PATCH /api/applications
│   │   ├── health.ts             # GET /api/health
│   │   └── metrics.ts            # GET /metrics (in-memory counters)
│   ├── services/
│   │   ├── gmail.ts              # Core sync logic: fetchemails()
│   │   ├── cron.ts               # EmailCronService (every 2h)
│   │   ├── emailClassifier.ts    # Classifies email into EmailType
│   │   ├── applicationMatcher.ts # Scores/matches email to existing app
│   │   ├── lifecycleEngine.ts    # EmailType → ApplicationStatus mapping
│   │   ├── statusTransition.ts   # Valid state machine transitions
│   │   ├── relevanceFilter.ts    # UNUSED — relevance scorer
│   │   └── user.ts               # getAllUsers() for cron
│   ├── parsers/
│   │   ├── index.ts              # parseEmail() — orchestrates parsing layers
│   │   ├── router.ts             # routeToATSParser() — ATS detection + extraction
│   │   ├── rule.parser.ts        # parseWithRules() — regex fallback
│   │   ├── gemini.parser.ts      # parseWithGemini() — LLM (UNUSED in prod)
│   │   ├── company.parser.ts     # extractCompany() from sender
│   │   ├── role.parser.ts        # extractRole() from subject
│   │   ├── workmodel.parser.ts   # extractWorkModel() from subject
│   │   └── engine/
│   │       ├── classifier.ts     # classifyFormat() — ATS domain detection
│   │       ├── ats-rules.ts      # ATS_REGISTRY — domain + regex rules per ATS
│   │       ├── extract.ts        # extractWithRegex() — regex runner
│   │       └── ignore-rules.ts   # shouldIgnoreEmail() — spam/alert filter
│   ├── pipeline/
│   │   └── email.pipeline.ts     # emailPipeline() — thin wrapper for parseEmail
│   ├── queues/
│   │   └── email.queue.ts        # BullMQ Queue definition
│   ├── types/
│   │   └── email.types.ts        # EmailInput, ParsedEmail interfaces
│   ├── utils/
│   │   ├── applicationMetadata.ts # extractSenderDomain(), normalizeCompany()
│   │   ├── googleclient.ts       # createOAuthClient() factory
│   │   ├── logger.ts             # Pino logger (env-aware)
│   │   ├── metrices.ts           # In-memory metrics counters
│   │   └── extractor.ts          # LEGACY — dead code (old extraction utils)
│   ├── validators/
│   │   └── application.validator.ts # Zod schemas for create/update
│   └── tests/                    # Vitest test files
├── prisma/
│   ├── schema.prisma             # DB models (User, Application)
│   └── migrations/               # 6 migration files (chronological history)
├── frontend/                     # React SPA
│   └── src/
│       ├── App.tsx               # Router setup
│       ├── main.tsx              # React root, AuthProvider wrap
│       ├── context/
│       │   └── authcontext.tsx   # AuthProvider + useAuth hook
│       ├── pages/
│       │   ├── login.tsx         # Login page (Google OAuth redirect)
│       │   └── dashboard.tsx     # Main dashboard
│       ├── components/
│       │   ├── dashboard/        # StatCard, StatusPieChart, ActivityChart
│       │   ├── modals/           # AddApplicationModal
│       │   ├── shared/           # ApplicationCard, ProtectedRoute
│       │   └── ui/               # StatusBadge, SkeletonCard
│       ├── hooks/
│       │   └── useApplications.ts # Data hook: fetch/add/update
│       ├── services/
│       │   └── api.ts            # Axios instance + API functions
│       └── types/
│           └── index.ts          # Application, ApiResponse, SingleApplicationResponse
├── docker-compose.yml            # postgres + API (no Redis defined)
├── Dockerfile                    # Multi-stage builder/runner
├── package.json                  # Backend deps + scripts
└── vitest.config.ts              # Vitest config (node env)
```

---

## 4. Database Schema

Defined in `prisma/schema.prisma`. Provider: PostgreSQL. Driver adapter: `@prisma/adapter-pg` (pg Pool).

### User
```
id            String    @id @default(uuid())
email         String    @unique
name          String?
googleId      String?   @unique
accessToken   String?   @db.Text    -- stored Google access token
refreshToken  String?   @db.Text    -- stored Google refresh token (used for re-auth)
lastSyncAt    DateTime?             -- updated after every sync, used for incremental queries
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
application   Application[]
```

### Application
```
id                String    @id @default(uuid())
messageId         String    @unique    -- Gmail message ID (DEDUPLICATION KEY)
subject           String    @default("None")
sender            String    @default("None")
companyName       String
role              String
status            String               -- "Applied" | "Assessment" | "Interview" | "Offer" | "Rejected"
workModel         String               -- "Remote" | "Hybrid" | "Onsite" | "Unknown"
gmailThreadId     String?              -- for thread-based matching of follow-ups
senderDomain      String?              -- extracted email domain (for fuzzy matching)
normalizedCompany String?              -- lowercase, stripped legal suffixes (for fuzzy matching)
userID            String?
user              User?     @relation(fields: [userID], references: [id], onDelete: Cascade)
dateApplied       DateTime  @default(now())
updatedAt         DateTime  @updatedAt

@@index([userID, updatedAt])
@@index([userID, normalizedCompany])
@@index([userID, senderDomain])
```

### Migration History
| Migration | Change |
|---|---|
| `20260420161800_init_multi_tenant` | Base User + Application tables |
| `20260421133600_add_oauth_tokens` | Added googleId, accessToken, refreshToken to User |
| `20260423124508_add_message_id_unique` | Added UNIQUE constraint on Application.messageId |
| `20260531161226_add_application_query_index` | Added `[userID, updatedAt]` index |
| `20260601105218_add_last_sync_at` | Added `lastSyncAt` to User |
| `20260605150638_add_application_matching_metadata` | Added gmailThreadId, senderDomain, normalizedCompany + indexes |

---

## 5. Backend Entry Points & Express App

### `src/index.ts` — Server Entry Point
```typescript
// Starts HTTP server on port 3000
// Starts EmailCronService (every 2h cron)
// Imports email.worker.ts (registers BullMQ worker as side-effect)
// Only starts server if NODE_ENV !== "test"
```

### `src/app.ts` — Express Configuration
```
Trust Proxy: 1                    (required for secure cookies behind proxy)
CORS: FRONTEND_URL or localhost:5173, credentials: true
JSON body parser
Cookie parser (reads careerpulse_auth cookie)

Route mounts:
  GET  /api/health      → health router
  POST /api/sync        → sync router
  *    /api/applications → application router
  *    /api/auth        → auth router
  GET  /metrics         → metrics router
```

### `src/db.ts` — Database Client
Single exported `prisma` instance. Uses `pg.Pool` with `PrismaPg` adapter. SSL enabled in production (`rejectUnauthorized: false`).

---

## 6. Authentication Architecture

### OAuth2 Flow

```
User → GET /api/auth/google
         ↓
     createOAuthClient() [CLIENT_ID, CLIENT_SECRET, GOOGLE_REDIRECT_URL]
         ↓
     oauth2client.generateAuthUrl({
       access_type: 'offline',  -- requests refresh_token
       scope: [userinfo.email, userinfo.profile, gmail.readonly],
       prompt: 'consent'        -- forces refresh_token issuance on every login
     })
         ↓
     redirect → Google consent screen
         ↓
User grants consent → Google redirects to GOOGLE_REDIRECT_URL

GET /api/auth/google/callback?code=<auth_code>
         ↓
     oauth2client.getToken(code) → { tokens }
         ↓
     oauth2.userinfo.get() → { email, name, id }
         ↓
     prisma.user.upsert({ where: { email } })
       -- stores/updates: name, googleId, accessToken, refreshToken
       -- refreshToken only written if present (Google only sends it on first consent)
         ↓
     jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
         ↓
     res.cookie('careerpulse_auth', token, {
       httpOnly: true,
       secure: true,
       path: '/',
       sameSite: 'none',    -- required for cross-origin (Vercel frontend + separate API)
       maxAge: 7d
     })
         ↓
     redirect → FRONTEND_URL (dashboard)
```

### Auth Middleware (`src/middlewares/auth.ts`)

Applied to all protected routes as `requiresauth` middleware.

```typescript
// Reads req.cookies.careerpulse_auth
// jwt.verify(token, JWT_SECRET)
// Attaches (req as any).userId = decoded.userId
// 401 if token missing or invalid
```

### Session Lifecycle
- Cookie TTL: 7 days
- JWT TTL: 7 days (aligned)
- No logout endpoint — cookie expires or must be cleared client-side
- Token refresh: not implemented — Google access token is refreshed implicitly by googleapis when using the stored refresh_token

### `GET /api/auth/me`
Returns `{ id, name, email }` for authenticated user. Used by frontend AuthProvider on every page load to verify session validity.

---

## 7. API Routes Reference

All routes are under `/api`. Authentication is handled by `requiresauth` middleware.

### `GET /api/health`
No auth. Returns `{ status: "alive", timestamp: ISO_STRING }`.

### `GET /metrics`
No auth. Returns in-memory counter object: `{ totalEmails, success, failed, llmCalls, llmFailures }`.

### `GET /api/auth/google`
No auth. Initiates Google OAuth flow → redirect.

### `GET /api/auth/google/callback`
No auth. OAuth2 callback handler. Sets cookie, redirects to FRONTEND_URL.

### `GET /api/auth/me`
**Auth required.** Returns `{ id, name, email }`.

### `POST /api/sync`
**Auth required.** Triggers manual Gmail sync for the authenticated user.
- Calls `fetchemails(userId)` directly (not via queue).
- Returns `{ success: true, snippet: Application[], count: number }`.
- `snippet` is the array of newly created applications (not all applications).

### `GET /api/applications`
**Auth required.** Returns all applications for the user.
- Ordered by `updatedAt DESC`.
- Returns `{ success: true, count: number, data: Application[] }`.

### `POST /api/applications`
**Auth required.** Creates a manual application entry.
- Validated by `createApplicationSchema` (Zod).
- Required: `companyName`, `role`.
- Optional: `subject`, `status` (enum: applied/interviewing/offer/rejected), `workModel` (enum: remote/onsite/hybrid).
- `messageId` is set to `crypto.randomUUID()` (ensures uniqueness for manual entries).
- `sender` is set to `"manual"`.
- Default status: `"Applied"`, default workModel: `"Unknown"`.
- Returns `{ success: true, data: Application }`.

### `PATCH /api/applications/:id`
**Auth required.** Updates status of a specific application.
- Validated by `updateStatusSchema` (Zod): `status` enum (applied/interviewing/offer/rejected).
- Verifies application belongs to authenticated user before updating (prevents IDOR).
- Returns `{ success: true, data: Application }`.

---

## 8. Gmail Sync Architecture

**File**: `src/services/gmail.ts` — `fetchemails(userId: string)`

This is the core business logic function. Called both from manual sync route and from BullMQ worker.

### Step-by-Step Flow

```
1. Load existing applications (for matching later)
   prisma.application.findMany({ where: { userID } })

2. Load user record
   { refreshToken, accessToken, lastSyncAt }
   → throws if user not found or no refreshToken

3. Create Gmail API client
   new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET)
   .setCredentials({ refresh_token, access_token })

4. Build Gmail query string
   if lastSyncAt:
     "(application OR interview OR job OR hiring OR position) after:<unix_timestamp> -newsletter"
   else:
     "(application OR interview OR job OR hiring OR position) newer_than:30d -newsletter"

5. Paginate Gmail messages list (50 per page)
   gmail.users.messages.list({ userId: "me", maxResults: 50, q: gmailQuery, pageToken? })
   → accumulates ALL message IDs across all pages

6. Process each message (pLimit(2) — max 2 concurrent)
   For each message:

   a. Increment metrics.totalEmails

   b. gmail.users.messages.get({ userId: "me", id: msg.id })
      → extract headers: Subject, From
      → extract: snippet, internalDate, threadId

   c. Skip if no Subject or From header

   d. emailPipeline({ subject, sender, snippet })
      → calls parseEmail() [see Section 9]
      → returns { companyName, role, workModel }

   e. If companyName === "IGNORE" → skip email (log + return null)

   f. classifyEmail({ subject, sender, snippet })
      → returns EmailType: APPLICATION | INTERVIEW | ASSESSMENT | REJECTION | OFFER | UPDATE | UNKNOWN

   g. Extract metadata:
      senderDomain = extractSenderDomain(sender)
      normalizedCompany = normalizeCompany(parsed.companyName)

   h. matchApplication(existingApplications, { gmailThreadId, senderDomain, normalizedCompany })
      → returns { application: Application | null, confidence: number }

   i. nextStatus = classificationToStatus(emailType)
      → null for APPLICATION, UPDATE, UNKNOWN

   j. Decision logic:
      - If match exists AND nextStatus is null → return null (skip, no update needed)
      - If match exists AND nextStatus AND confidence > 0:
          if canTransition(match.application.status, nextStatus):
            UPDATE application status in DB → return null (no new record)
      - Otherwise → fall through to create new application

   k. Compute dateApplied:
      prefer email header "Date" → fallback to internalDate → fallback to now()

   l. Increment metrics.success
      Return application data object for bulk insert

7. Filter out null values

8. prisma.application.createMany({ data: filtered, skipDuplicates: true })
   skipDuplicates: true → messageId unique constraint prevents re-inserts

9. Update user.lastSyncAt = new Date()

10. Return filtered (newly created application records)
```

### Key Design Points

- **Incremental sync**: `lastSyncAt` drives `after:` query filter. Only emails newer than last sync are fetched.
- **First sync**: Uses `newer_than:30d` — fetches last 30 days of matching emails.
- **Deduplication**: `messageId` (Gmail message ID) is a UNIQUE constraint. `createMany` with `skipDuplicates: true` handles race conditions.
- **Concurrency limit**: `pLimit(2)` prevents hammering Gmail API. Each individual message requires a separate `messages.get()` call.
- **Status update vs new record**: Follow-up emails (interview invite, rejection) update the existing application rather than creating duplicates.

---

## 9. Parsing Architecture (Critical)

> **⚠️ SUPERSEDED (2026-07-22):** This section describes the v1 parsing architecture, which was replaced by Parsing Architecture v2. See the [Changes](#changes) section at the bottom of this document for the current design. Sections 9 and the parsing-related items in Section 17 are kept for historical context only.

**Entry**: `src/pipeline/email.pipeline.ts` → `emailPipeline()` → `parseEmail()` in `src/parsers/index.ts`

The parser takes `EmailInput { subject, sender, snippet }` and returns `ParsedEmail { companyName, role, workModel }`.

### 3-Layer Cascade

```
emailPipeline(input)
      ↓
parseEmail(input)
      ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Ignore Filter                                   │
│ shouldIgnoreEmail(sender, subject)                       │
│   IGNORE_SENDERS: seek.com, jobright.ai,                │
│                   wellfound.com, linkedin.com            │
│   IGNORE_SUBJECTS (regex):                               │
│     /\+\s*\d+\s+new jobs/i                              │
│     /recommended jobs/i                                  │
│     /jobs matching/i                                     │
│     /open positions/i                                    │
│     /daily alert/i                                       │
│     /weekly alert/i                                      │
│     /job alert/i                                         │
│     /top jobs/i                                          │
│                                                          │
│ → If matched: return { companyName: "IGNORE",            │
│                         role: "IGNORE",                  │
│                         workModel: "Unknown" }           │
└─────────────────────────────────────────────────────────┘
      ↓ (not ignored)
┌─────────────────────────────────────────────────────────┐
│ Layer 2: ATS Router                                      │
│ routeToATSParser(input)                                  │
│                                                          │
│   Step A: classifyFormat(sender)                         │
│     → iterates ATS_REGISTRY, checks if sender           │
│       domain matches any rule.domains                    │
│     → returns ATS name or "DIRECT"                      │
│                                                          │
│   ATS_REGISTRY entries:                                  │
│     WORKDAY    → myworkdayjobs.com, workday.com          │
│     ASHBY      → ashbyhq.com                             │
│     GREENHOUSE → greenhouse.io                           │
│     LEVER      → lever.co                                │
│     WELLFOUND  → wellfound.com, angel.co                 │
│     LINKEDIN   → linkedin.com                            │
│     INDEED     → indeed.com                              │
│     INTERNSHALA→ internshala.com                         │
│                                                          │
│   Step B: If "DIRECT" → return null (skip ATS)          │
│                                                          │
│   Step C: Find matching rule in ATS_REGISTRY             │
│                                                          │
│   Step D: extractWithRegex(`${subject} ${snippet}`,      │
│              rule.companyRegex) → companyName            │
│           extractWithRegex(`${subject} ${snippet}`,      │
│              rule.roleRegex)    → role                   │
│                                                          │
│   Note: Only WORKDAY and ASHBY have populated regex.     │
│   GREENHOUSE, LEVER, WELLFOUND, LINKEDIN, INDEED,        │
│   INTERNSHALA have empty regex arrays → always null.     │
│                                                          │
│   Step E: If both null → return null                     │
│           Else → return { companyName, role, "Unknown" } │
└─────────────────────────────────────────────────────────┘
      ↓ (ATS returned null OR failed)
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Rule Parser (Fallback)                          │
│ parseWithRules(input)                                    │
│                                                          │
│   extractCompany(sender):                                │
│     1. Try text patterns on full sender string:          │
│        /applied to ([a-zA-Z]+)/i                         │
│        /application at ([a-zA-Z]+)/i                     │
│        /from ([a-zA-Z]+)/i                               │
│     2. Try name-before-email: "Name <email>" → "Name"   │
│        strip generic prefixes (careers/jobs/noreply etc) │
│     3. Try domain from email: user@domain.tld → domain   │
│     4. Fallback: "Unknown Company"                       │
│                                                          │
│   extractRole(subject):                                  │
│     Patterns (applied in order):                         │
│       /application for\s+(.*?)(?:\s+at|\s+-|\s+in|$)/i  │
│       /applied for\s+(.*?)(?:...)/i                      │
│       /position[:\s]+(.*?)(?:...)/i                      │
│       /role[:\s]+(.*?)(?:...)/i                          │
│       /(software engineer|backend engineer|...)/i        │
│     Fallback: "Software Engineer"                        │
│                                                          │
│   extractWorkModel(subject):                             │
│     Keyword map: remote, hybrid, onsite, on-site,        │
│                  wfh, work from home                     │
│     Fallback: "Unknown"                                  │
└─────────────────────────────────────────────────────────┘
```

### `extractWithRegex(text, patterns)`
Iterates patterns array, returns `match[1].replace(/[^\w\s&-]/g, "").trim()` for first match. Returns null if no pattern matches.

### ATS-Specific Regex Detail

**WORKDAY** (`myworkdayjobs.com`, `workday.com`):
- Company: `/^"?(.+?)\s+(?:Careers|Talent|Recruiting)/i`, `/application to\s+(.+?)(?:\.|$)/i`
- Role: `/position of\s+(.+?)(?:\.|$)/i`, `/applying to the (.+?) position/i`

**ASHBY** (`ashbyhq.com`):
- Company: `/application to\s+(.+?)(?:\.|$)/i`, `/thank you for applying to\s+(.+?)(?:\.|$)/i`, `/^(.+?)\s+(?:Hiring|Recruiting|Talent)/i`
- Role: `/for the\s+(.+?)\s+role/i`, `/interest in the\s+(.+?)\s+position/i`, `/for\s+(.+?)\s+at/i`

**All others** (GREENHOUSE, LEVER, WELLFOUND, LINKEDIN, INDEED, INTERNSHALA): Empty regex → always fall through to rule parser.

### Gemini Parser (PRESENT BUT NOT IN PRODUCTION PATH)

`src/parsers/gemini.parser.ts` — `parseWithGemini()`:
- Uses `gemini-2.5-flash-lite` model.
- Prompt: structured JSON extraction of `{ companyName, role, workModel }`.
- Has: `isJobEmail()` pre-filter, 10-min in-memory cache (`Map<string, {data, time}>`), retry with quota-aware backoff (3 retries, 10s×attempt on quota errors, 1s×attempt otherwise), 15s timeout.
- Increments `llmCalls` / `llmFailures` metrics.
- **`parseEmail()` in `src/parsers/index.ts` does NOT call this.** It is completely unused in the production flow. The cascade goes: ignore → ATS → rule parser. Gemini is dead code.

---

## 10. Email Classification & Lifecycle Engine

### Email Classifier (`src/services/emailClassifier.ts`)

`classifyEmail({ subject, sender, snippet })` → `EmailType`

Text = `${subject} ${snippet}` (lowercased). Priority order (first match wins):

```
OFFER       → "offer", "offer letter", "compensation", "joining date",
               "pleased to offer", "excited to extend"

REJECTION   → "unfortunately", "regret to inform", "not moving forward",
               "other candidates", "position has been filled",
               "application was not selected", "thank you for your interest"

INTERVIEW   → "interview", "schedule", "availability", "meet with",
               "hiring manager", "interview round", "interview invitation"

ASSESSMENT  → "assessment", "coding challenge", "hackerrank",
               "take-home", "technical test", "online assessment"

APPLICATION → "thank you for applying", "application received",
               "received your application", "application confirmation"

UPDATE      → "under review", "application update",
               "reviewing your application", "next steps", "status update"

UNKNOWN     → (default)
```

### Lifecycle Engine (`src/services/lifecycleEngine.ts`)

`classificationToStatus(emailType)` → `ApplicationStatus | null`

```
ASSESSMENT  → "Assessment"
INTERVIEW   → "Interview"
OFFER       → "Offer"
REJECTION   → "Rejected"
APPLICATION → null   (confirmation email, no status change)
UPDATE      → null   (informational)
UNKNOWN     → null
```

`ApplicationStatus` type: `"Applied" | "Assessment" | "Interview" | "Offer" | "Rejected"`

### Status Transition Machine (`src/services/statusTransition.ts`)

`canTransition(current: ApplicationStatus, next: ApplicationStatus)` → `boolean`

```
Applied     → Assessment, Interview, Offer, Rejected
Assessment  → Interview, Offer, Rejected
Interview   → Offer, Rejected
Offer       → (terminal, no transitions)
Rejected    → (terminal, no transitions)
```

All transitions are strictly forward. No backward transitions are allowed. Status can skip stages (e.g., Applied → Offer directly).

---

## 11. Application Matching Engine

**File**: `src/services/applicationMatcher.ts`

`matchApplication(applications: Application[], input: MatchInput)` → `MatchResult`

Purpose: Determine if an incoming email relates to an **existing** application (rather than a new one).

### Scoring Algorithm

For each existing application, compute a score:

| Signal | Condition | Points |
|---|---|---|
| Thread match | `input.gmailThreadId === app.gmailThreadId` | +100 |
| Domain match | `input.senderDomain === app.senderDomain` | +40 |
| Company match | `input.normalizedCompany === app.normalizedCompany` | +30 |

Max possible score: 170 (all three match).

### Match Result
- Returns `{ application: null, confidence: 0 }` if: no matches, tie (ambiguous), or score = 0.
- Returns `{ application: bestMatch, confidence: score/170 }` for unique best match.
- Confidence is a float: 0.0 → 1.0.

### Usage in Gmail Sync
```
match.application = null        → email is a new application → create record
match.application != null       → existing match found
  + nextStatus = null           → no status change, skip (return null)
  + nextStatus != null          → try to advance status
    canTransition()? → UPDATE    → return null (no new record)
    !canTransition() → fall through → create new record (edge case: e.g., re-applied)
```

### Metadata Preprocessing

**`extractSenderDomain(sender)`** (`src/utils/applicationMetadata.ts`):
- Regex: `/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/`
- Extracts full email, splits on `@`, returns domain lowercased.
- Returns `null` if no email found.

**`normalizeCompany(company)`** (`src/utils/applicationMetadata.ts`):
- Lowercase + trim.
- Strip legal suffixes: `inc`, `llc`, `ltd`, `corp`, `corporation` (word-boundary aware).
- Strip non-word/non-space characters.
- Used for matching: `"Stripe Inc" → "stripe"`, `"Google LLC" → "google"`.

---

## 12. Async Infrastructure: Cron + BullMQ + Worker

### Cron Service (`src/services/cron.ts`)

`EmailCronService` class, exported as singleton `emailCronService`.

**Schedule**: `0 */2 * * *` — at minute 0 of every 2nd hour (12am, 2am, 4am...).
**Timezone**: `Asia/Kolkata` (IST).

**Flow**:
```
emailCronService.start()
  → schedules cron job
  → registers SIGINT/SIGTERM handlers (graceful shutdown)

Every 2h: executeSync()
  → isRunning guard (skips if previous run still active)
  → runWithRetry() with 3 attempts, exponential delay (5s × attempt)
  → withTimeout(processAllUsers(), 10 minutes)

processAllUsers():
  → getAllUsers() — fetches all user IDs
  → for each user:
      emailQueue.add("sync-user", { userId })
      sleep(1000)   -- 1s delay between queuing jobs
```

### BullMQ Queue (`src/queues/email.queue.ts`)

Queue name: `"email-sync"`.
Connection: Redis at `REDIS_HOST:REDIS_PORT` (default: `localhost:6379`).

Default job options:
- `attempts: 3` — 3 total tries per job
- `backoff: { type: "exponential", delay: 5000 }` — 5s, 10s, 20s between retries
- `removeOnComplete: 100` — keep last 100 completed jobs
- `removeOnFail: 50` — keep last 50 failed jobs

### BullMQ Worker (`src/email.worker.ts`)

Worker name: `"email-sync"` (same queue name).
Connection: same Redis config.
Concurrency: `2` — processes up to 2 jobs simultaneously.

Worker handler:
```typescript
async (job) => {
  const { userId } = job.data;
  await fetchemails(userId);  // full sync for that user
}
```

**Lifecycle**: Worker is registered as a side-effect import in `src/index.ts`. It starts when the server starts and runs alongside the HTTP server in the same process.

**IMPORTANT**: Docker Compose does NOT define a Redis service. Redis must be provided externally (or added to docker-compose) for BullMQ to work in production.

---

## 13. Utility Layer

### `src/utils/logger.ts`
Pino logger. Behavior by `NODE_ENV`:
- `production`: JSON output (stdout).
- `test`: Silent (no output).
- `development`: pino-pretty with colorized output.

### `src/utils/metrices.ts`
In-memory counters (reset on server restart):
```typescript
{ totalEmails, success, failed, llmCalls, llmFailures }
```
`increment(key)` — increments one counter. Exposed via `GET /metrics`.

### `src/utils/googleclient.ts`
Factory: `createOAuthClient()` → `new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, GOOGLE_REDIRECT_URL)`.
Used in auth routes for the OAuth2 code exchange.
(Note: `fetchemails` creates its own OAuth2 client directly — does not use this factory.)

### `src/utils/extractor.ts` — LEGACY/DEAD CODE
Contains `extractCleanData()`, `exractWorkmodel()` (typo in name), `extractRole()`.
These are earlier implementations replaced by the parsers in `src/parsers/`. This file is imported nowhere in the current codebase.

---

## 14. Frontend Architecture

### Entry Point: `frontend/src/main.tsx`
Renders `<AuthProvider><App /></AuthProvider>`. AuthProvider wraps the entire tree.

### Router: `frontend/src/App.tsx`
```
BrowserRouter
  /login        → Login (public)
  /dashboard    → ProtectedRoute > Dashboard
  *             → Navigate to /dashboard
```

### Auth Context (`frontend/src/context/authcontext.tsx`)

`AuthProvider`:
- On mount: calls `getUseProfile()` → `GET /api/auth/me`.
- Sets `user` (profile data) or `null`.
- Exposes `{ user, isLoading }` via `useAuth()` hook.
- No logout function (cookie cleared manually or expires).

`ProtectedRoute`:
- `isLoading` → `<LoadingScreen>` (animated progress bar + logo, uses animejs).
- `!user` → `<Navigate to="/login" replace />`.
- `user` → renders children.

### Login Page (`frontend/src/pages/login.tsx`)
- `handleGoogleLogin()`: sets `loading=true`, waits 300ms, then `window.location.href = ${VITE_API_URL}/auth/google`.
- Animated background orbs (animejs, looping, 12/15/18s durations).
- Feature pills: Auto-sync Gmail, Visual analytics, Status tracking, Secure & private.

### Dashboard (`frontend/src/pages/dashboard.tsx`)

State:
- `search` / `debouncedSearch` (300ms debounce) — filters by companyName.
- `filter` — status filter ("all" / "applied" / "interviewing" / "offer" / "rejected").
- `isSyncing` — sync button loading state.
- `isModalOpen` — controls AddApplicationModal visibility.

Memoized computations:
- `stats` — counts by status from applications array.
- `finalApps` — filtered + searched applications.
- `activityData` — `{ date: string, count: number }[]` grouped by `dateApplied`.
- `pieData` — status distribution for pie chart.

Actions:
- **Sync**: `POST /api/sync` → `refetch()`.
- **Add**: Opens modal → `addApplication(data)` → optimistic prepend to list.
- **Filter change**: Triggers animejs animation on `.app-card` elements (opacity + translateY stagger).

### `useApplications` Hook (`frontend/src/hooks/useApplications.ts`)
Manages all application state:
- `fetchApplications()` — `GET /api/applications`, sets state.
- `addApplication(data)` — `POST /api/applications`, prepends to state optimistically.
- `updateStatus(id, status)` — `PATCH /api/applications/:id`, updates in state.
- Returns: `{ applications, loading, error, refetch, addApplication, updateStatus }`.

### API Client (`frontend/src/services/api.ts`)
Axios instance:
- `baseURL: VITE_API_URL` (e.g., `http://localhost:3000/api` or production API URL).
- `withCredentials: true` — sends cookie with every request.
- Response interceptor: logs 401s but does not auto-redirect (handled by AuthProvider on next render).

Functions:
- `getApplication()` → `GET /applications` → `Application[]`.
- `getUseProfile()` → `GET /auth/me` → user object or null.
- `createApplication(data)` → `POST /applications` → `Application`.
- `updateApplicationStatus(id, status)` → `PATCH /applications/:id` → void.

### Components

**`ApplicationCard`**:
- Shows: company initial avatar, StatusBadge, companyName, role, workModel, dateApplied.
- "Update Status" uses `window.prompt()` for status input — no dropdown/modal.
- Calls `updateApplicationStatus(id, newStatus)` directly (not via hook).
- Local state for optimistic update.

**`StatusBadge`**:
- Maps status string (lowercased) to color config: applied=blue, interviewing=purple, offer=green, rejected=red.
- Animated pulsing dot (CSS animation `status-ping`) on all statuses except "rejected".

**`StatCard`**: Number + label display card. Color via Tailwind class prop.

**`StatusPieChart`**: Recharts `PieChart` with 4 sectors (Applied/Interviewing/Offer/Rejected).

**`ActivityChart`**: Recharts `BarChart` with date on X axis, count on Y axis.

**`AddApplicationModal`**:
- Fields: companyName (required), role (required), status (segmented: applied/interviewing/offer/rejected), workModel (segmented: remote/onsite/hybrid).
- Frontend validation: companyName and role required.
- Animated open/close with animejs.
- Closes on Escape key or backdrop click.

**`SkeletonCard`**: Placeholder cards shown during initial load.

### Frontend Environment
- `VITE_API_URL` — full base URL of the backend API (e.g., `https://api.careerpulse.com/api`).
- Deployed separately from backend (Vercel — see `frontend/vercel.json`).

---

## 15. Infrastructure & Deployment

### Docker Compose (`docker-compose.yml`)
Defines 2 services:
```
pulse-db   → postgres:15-alpine, port 5432, health check (pg_isready), volume pgdata
pulse-api  → built from Dockerfile, port 3000, depends on pulse-db health, NODE_ENV=production
```

**CRITICAL GAP**: No Redis service is defined. BullMQ (cron queuing + worker) requires Redis. For the async pipeline to work in Docker, either:
1. Add a Redis service to docker-compose.yml, or
2. Provide external Redis and set `REDIS_HOST`/`REDIS_PORT`.

Without Redis, the cron-based sync will fail. Manual sync (`POST /api/sync`) bypasses the queue and works without Redis.

### Dockerfile (Multi-Stage Build)
**Builder stage** (`node:20-alpine`):
1. `npm ci` — install all deps.
2. `npx prisma generate` — generate Prisma client.
3. `npm run build` — TypeScript compile to `dist/`.

**Runner stage** (`node:20-alpine`):
1. `npm ci --omit=dev` — production deps only.
2. `npx prisma generate` — regenerate Prisma client.
3. Copy `dist/` from builder.
4. `USER node` — non-root user for security.
5. `EXPOSE 3000`.
6. `CMD ["npm", "run", "start"]` → `node dist/index.js`.

### Deployment Pattern
- Backend: Docker container (self-hosted or cloud VM).
- Frontend: Vercel (separate deployment from backend).
- Database: External PostgreSQL (connection via `DATABASE_URL`).
- Redis: Must be provided externally (not in docker-compose).
- Cookie requires `SameSite=None; Secure` because frontend and API are on different origins.

---

## 16. Testing

Framework: Vitest 4. Config: `vitest.config.ts` — environment: `node`.
Run: `NODE_ENV=test vitest`.

### Test Files (`src/tests/`)

| File | What It Tests |
|---|---|
| `pipeline.test.ts` | `emailPipeline()` end-to-end; mocks Gemini parser |
| `classifier.test.ts` | `classifyFormat()` — ATS domain detection for WORKDAY, ASHBY, GREENHOUSE, LINKEDIN, DIRECT |
| `router.test.ts` | `routeToATSParser()` — company/role extraction from WORKDAY and ASHBY emails |
| `ignore-rules.test.ts` | `shouldIgnoreEmail()` — SEEK, Jobright blocked; Stripe, Ashby allowed |
| `emailClassifier.test.ts` | `classifyEmail()` — keyword detection for all EmailType values |
| `applicationMatcher.test.ts` | `matchApplication()` — scoring, ambiguity, confidence |
| `lifecycleEngine.test.ts` | `classificationToStatus()` — EmailType → ApplicationStatus mapping |
| `statusTransition.test.ts` | `canTransition()` — valid/invalid transitions |
| `relevanceFilter.test.ts` | `isRelevantJobEmail()` — positive/negative signal scoring |
| `application.test.ts` | HTTP integration tests for application routes |
| `auth.test.ts` | HTTP integration tests for auth routes |
| `protected.test.ts` | Auth middleware: rejects missing/invalid tokens |
| `parser.test.ts` | Parser unit tests |

---

## 17. Known Issues, Quirks & Dead Code

### 1. Gemini Parser Is Dead Code
`src/parsers/gemini.parser.ts` is fully implemented (caching, retry, timeout, quota handling) but `src/parsers/index.ts` never calls it. The `parseEmail()` function goes: ignore → ATS router → rule parser. The `/metrics` endpoint tracks `llmCalls`/`llmFailures` but these are never incremented in production.

### 2. `src/utils/extractor.ts` Is Legacy Dead Code
An older extraction module. Contains `extractCleanData`, `exractWorkmodel` (note typo), `extractRole`. Not imported anywhere. Superseded by the parser files in `src/parsers/`.

### 3. `relevanceFilter.ts` Is Unused
`isRelevantJobEmail()` implements a positive/negative keyword scoring system but is never called in the sync flow. The `shouldIgnoreEmail()` in `engine/ignore-rules.ts` handles filtering instead.

### 4. Status Value Case Mismatch
- Backend `lifecycleEngine.ts` `ApplicationStatus` type uses: `"Applied"`, `"Assessment"`, `"Interview"`, `"Offer"`, `"Rejected"` (capitalized, "Interview" not "Interviewing").
- Backend `validators/application.validator.ts` Zod schemas accept: `"applied"`, `"interviewing"`, `"offer"`, `"rejected"` (lowercase, "interviewing" not "interview").
- Frontend `StatusBadge` normalizes via `.toLowerCase()` → maps to `applied`, `interviewing`, `offer`, `rejected`.
- The DB stores whatever value is set: manual entries use the Zod enum values; auto-synced entries use the lifecycle engine's capitalized values. This creates inconsistent casing in the database.

### 5. Docker Compose Missing Redis
`docker-compose.yml` has no Redis service. The BullMQ cron pipeline requires Redis. Manual sync still works without Redis.

### 6. GREENHOUSE, LEVER, WELLFOUND, LINKEDIN, INDEED, INTERNSHALA Have No Extraction Regex
These ATS entries in `ATS_REGISTRY` have empty `companyRegex` and `roleRegex` arrays. `routeToATSParser` will detect the domain (via `classifyFormat`) but `extractWithRegex` will always return null for both fields → `routeToATSParser` returns null → falls through to rule parser. These ATS entries exist as stubs for future implementation.

### 7. `window.prompt()` for Status Update
`ApplicationCard` uses the browser's native `window.prompt()` to get the new status value. No validation against the enum — any string can be submitted. This is intentional (quick implementation) but fragile.

### 8. In-Memory Metrics Lost on Restart
`src/utils/metrices.ts` counters are in-memory. Any server restart resets all counters. No persistence.

### 9. `createOAuthClient` Not Used in `fetchemails`
`src/utils/googleclient.ts` exports `createOAuthClient()` (used in `routes/auth.ts`). However, `fetchemails` in `services/gmail.ts` creates its own OAuth2 client inline (with only CLIENT_ID and CLIENT_SECRET, no redirect URL — correct for token-based re-auth). These are parallel implementations.

### 10. No Webhook Route (dist has one, src does not)
`dist/routes/webhook.js` exists in the compiled output but there is no `src/routes/webhook.ts` source file. This appears to be a compiled artifact from a deleted source file. The webhook route is not mounted in `app.ts`.

---

## 18. Environment Variables

### Backend (`.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `CLIENT_ID` | Yes | Google OAuth2 client ID |
| `CLIENT_SECRET` | Yes | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URL` | Yes | OAuth2 callback URL (must match Google Console) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `FRONTEND_URL` | Yes | Frontend origin for CORS and post-auth redirect |
| `GEMINI_API_KEY` | No | Google Gemini API key (unused in prod parsing path) |
| `REDIS_HOST` | No | Redis host (default: localhost) |
| `REDIS_PORT` | No | Redis port (default: 6379) |
| `NODE_ENV` | No | `production` \| `development` \| `test` |

### Frontend (`.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL (e.g., `http://localhost:3000/api`) |

---

## 19. End-to-End Data Flow Diagrams

### Authentication Flow
```
Browser → GET /api/auth/google
            → redirect to Google OAuth consent screen
              → User grants: email, profile, gmail.readonly
                → GET /api/auth/google/callback?code=XXX
                    exchange code → tokens
                    upsert user in DB (store accessToken, refreshToken)
                    sign JWT (userId, 7d expiry)
                    Set-Cookie: careerpulse_auth=<jwt>; HttpOnly; Secure; SameSite=None
                    → redirect to FRONTEND_URL
                       → AuthProvider calls GET /api/auth/me
                          → { id, name, email }
                          → user state set → ProtectedRoute renders Dashboard
```

### Manual Sync Flow
```
User clicks "Sync" → POST /api/sync
  → requiresauth middleware reads cookie → verifies JWT → attaches userId
  → fetchemails(userId)
      → Gmail API (paginated) → message list
      → for each message (pLimit 2 concurrent):
          → Gmail API get message → headers + snippet
          → emailPipeline() → parseEmail():
              shouldIgnoreEmail? → return IGNORE
              routeToATSParser()? → ATS regex extraction
              parseWithRules() → company/role/workModel from sender/subject
          → if IGNORE → skip
          → classifyEmail() → EmailType
          → extractSenderDomain() + normalizeCompany()
          → matchApplication() → MatchResult
          → if match + canTransition → UPDATE existing app status
          → else → collect for bulk insert
      → createMany(newApps, skipDuplicates: true)
      → UPDATE user.lastSyncAt
  → return { success: true, count, snippet: newApps }
  → frontend calls refetch() → GET /api/applications → re-renders dashboard
```

### Automatic Cron Flow
```
Server start → emailCronService.start()
               → node-cron schedule: 0 */2 * * * (every 2h, IST)
               → BullMQ Worker registered (concurrency: 2)

Every 2h:
  EmailCronService.executeSync()
    → isRunning guard
    → processAllUsers():
        getAllUsers() → [{ id }, ...]
        for each user:
          emailQueue.add("sync-user", { userId })
          sleep(1000ms)
    
    BullMQ Queue (Redis) → Worker picks up job
      → fetchemails(userId)
         (same flow as manual sync above)
      → job retries up to 3x on failure (exponential backoff: 5s → 10s → 20s)
```

### Parsing Decision Tree (per email)
```
email: { subject, sender, snippet }
          ↓
shouldIgnoreEmail(sender, subject)?
  YES → { companyName: "IGNORE", ... } → caller skips
  NO  ↓
routeToATSParser({ subject, sender, snippet })?
  classifyFormat(sender):
    domain in ATS_REGISTRY? → ATS_NAME
    else → "DIRECT"
  if "DIRECT" → null
  if ATS with empty regex → null
  if ATS with regex AND extraction succeeds → { companyName, role, workModel: "Unknown" }
  if extraction fails (both null) → null
  null ↓
parseWithRules({ subject, sender, snippet })
  extractCompany(sender) → string
  extractRole(subject)   → string
  extractWorkModel(subject) → "Remote"|"Hybrid"|"Onsite"|"Unknown"
  → { companyName, role, workModel }
```

### Application Status Lifecycle
```
Initial:  "Applied"    ← set when email is parsed as new application

Possible transitions (triggered by subsequent emails on same thread):
  Applied → Assessment  (coding test / online assessment received)
  Applied → Interview   (interview invite received)
  Applied → Offer       (offer letter received)
  Applied → Rejected    (rejection email received)

  Assessment → Interview
  Assessment → Offer
  Assessment → Rejected

  Interview → Offer
  Interview → Rejected

  Offer    (terminal — no further transitions)
  Rejected (terminal — no further transitions)
```

---

## Changes

### 2026-07-22 — Parsing Architecture v2 (uncommitted, on `feature/parsing-accuracy-upgrade`)

**Why**: v1 parsing had low precision (job alerts/promos became application cards), low recall (LinkedIn/Wellfound were blanket-blocked, killing real "Your application was sent to X" confirmations), fabricated data (`"Software Engineer"` default role), only 2 working ATS extractors, substring-based domain matching, and a fully-built-but-never-called Gemini parser. Status updates misfired because the classifier used raw substring matching ("offerings" → OFFER, "thank you for your interest" alone → REJECTION).

**What**: Complete rewrite of the parsing layer into a classify-first / extract-second / LLM-last pipeline:

```
EmailInput (now enriched: + body, + Gmail labelIds)
   ▼
[0] TRIAGE GATE (engine/triage.ts)
    Gmail category labels (CATEGORY_PROMOTIONS/SOCIAL/FORUMS, ATS senders exempt)
    → alert-only sender mailboxes (naukrialerts@, jobalerts@, marketing@ …)
    → ~27 universal alert/digest/promo subject patterns
    → per-source noise patterns (e.g. LinkedIn invites/digests)
    → per-source confirmation shortcut (e.g. "Your application was sent to …")
    → weighted relevance scoring (strong +3 / weak +1 / negative −3;
      threshold 1 for known sources, 3 for unknown senders)
   ▼ PROCESS
[1] SENDER RESOLUTION (engine/sender.ts)
    RFC-2822 From parsing → displayName / localPart / domain
    exact-or-subdomain matching (fixes the includes() lookalike-domain bug)
   ▼
[2] SOURCE REGISTRY (engine/registry.ts) — ~40 sources:
    India boards: Naukri, LinkedIn, Indeed, Internshala, Instahyre, Cutshort,
      foundit/Monster, Hirist, Shine, TimesJobs, Apna
    India ATS/HRMS: Zoho Recruit, Keka, Darwinbox, Freshteam, TurboHire
    Global ATS: Workday, Greenhouse (incl. greenhouse-mail.io!), Lever, Ashby,
      SmartRecruiters, iCIMS, Taleo, SuccessFactors, Workable, BambooHR,
      Jobvite, Recruitee, Teamtailor, JazzHR/applytojob, Breezy, Personio,
      Rippling, Dover
    Remote/abroad boards: Wellfound, Glassdoor, ZipRecruiter, Turing,
      Crossover, YC Work at a Startup, RemoteOK, WWR, Himalayas, Remotive …
   ▼
[3] LAYERED EXTRACTION (engine/extractors.ts + engine/validate.ts)
    3a. source-specific field patterns          (confidence ≈ 0.9)
    3b. generic phrase library (~25 patterns)   (confidence 0.5–0.85)
    3c. sender-derived company (displayName/domain, platform-domain aware) (0.4–0.5)
    merge by confidence → validation: company stoplist (generic mailbox words
    + ATS/board product names + TLD-evasion check), role shape checks,
    canonical role map (SDE→Software Engineer), NO fabricated defaults
   ▼ (company or role still missing/weak — rare)
[4] LLM FALLBACK (gemini.parser.ts — now actually wired in)
    Gemini 2.5 Flash Lite with structured JSON responseSchema, receives body,
    returns isJobApplicationEvent (can overrule triage on borderline cases),
    output passes the same validators; cache/retry/timeout/metrics retained;
    lazy init (no crash without GEMINI_API_KEY)
   ▼
ParsedEmail { companyName, role, workModel, confidence, source }
```

The `"IGNORE"` sentinel contract with `gmail.ts` is unchanged. The classifier that drives card status updates (`emailClassifier.ts`) now uses word-boundary regexes and co-occurrence rules ("thank you for your interest" needs a rejection cue; "schedule"/"availability" need call/recruiter context) and reads the email body.

**Files added**
- `src/parsers/engine/sender.ts` — From-header parsing + safe domain matching
- `src/parsers/engine/registry.ts` — ~40-source registry (domains, confirmation/ignore patterns, field patterns)
- `src/parsers/engine/triage.ts` — relevance gate (labels, alert senders/subjects, weighted scoring)
- `src/parsers/engine/extractors.ts` — pattern runner, generic phrase library, sender-derived company, work model
- `src/parsers/engine/validate.ts` — company/role cleaning + validation, stoplists, canonical role map
- `src/utils/extractEmailBody.ts` — Gmail payload → plain text (text/plain preferred, HTML fallback, 4k cap)
- `src/tests/fixtures/emails.ts` — 46-fixture realistic corpus (28 real events across all major sources, 18 junk)
- `src/tests/extraction-accuracy.test.ts` — corpus accuracy suite (100% junk rejection, 0 dropped real events, ≥90% company, ≥85% role, no-fabrication check)
- `src/tests/triage.test.ts`, `src/tests/sender.test.ts`, `src/tests/validate.test.ts`

**Files modified**
- `src/parsers/index.ts` — new orchestrator implementing stages 0–4
- `src/parsers/gemini.parser.ts` — structured output schema, body input, `isJobApplicationEvent`, lazy init
- `src/services/emailClassifier.ts` — regex word boundaries, co-occurrence rules, optional `body` input
- `src/types/email.types.ts` — `EmailInput` + optional `body`/`labelIds`; `ParsedEmail` + optional `confidence`/`source`
- `src/services/gmail.ts` — minimal input enrichment only: `extractEmailBody(payload)` + `labelIds` passed into `emailPipeline()` and `classifyEmail()`
- `src/tests/emailClassifier.test.ts` — added precision cases (soft-rejection, offerings≠offer, scheduling context, body classification)

**Files deleted (superseded/absorbed)**
- `src/parsers/engine/ignore-rules.ts`, `classifier.ts`, `ats-rules.ts`, `extract.ts` (v1 engine)
- `src/parsers/router.ts`, `rule.parser.ts`, `company.parser.ts`, `role.parser.ts`, `workmodel.parser.ts`
- `src/services/relevanceFilter.ts` (was dead code; concept absorbed into triage)
- `src/utils/extractor.ts` (legacy dead code)
- `src/tests/ignore-rules.test.ts`, `router.test.ts`, `classifier.test.ts`, `parser.test.ts`, `relevanceFilter.test.ts` (cases migrated into fixtures corpus / triage / sender tests)

**Not touched** (pre-existing uncommitted diffs left as-is, outside parsing scope): `docker-compose.yml` (DB port mapping), `src/db.ts` (SSL only in prod), `assets/dashboard_preview.png` deletion.

**Verification**: `NODE_ENV=test npx vitest run src/tests` → 12 files, 72 tests, all passing (typecheck `npx tsc --noEmit` clean). Note: plain `npx vitest run` additionally executes stale compiled tests under `dist/` from an old build — harmless, disappears after the next build.

---

### 2026-07-23 — Triage accuracy patch + Gemini rate-limit fix (uncommitted)

**Why**: Live testing revealed two remaining issues: (1) some job board newsletters still passed triage due to 4 specific bugs in the v2 scoring logic; (2) the Gemini fallback fired too aggressively on free-tier keys, exhausting the quota in seconds when a batch of emails was synced concurrently.

**Triage fixes** (`src/parsers/engine/triage.ts`):
- Scoring now operates on `headText` (subject + snippet) only, not `fullText`. Newsletter body text ("update your application", "X companies are interviewing") was inflating STRONG/WEAK positive scores and pushing alerts past the relevance threshold.
- `\binterview\b` and `\bassessment\b` demoted from STRONG_POSITIVE (+3) to WEAK_POSITIVE (+1). A newsletter body mentioning "interview opportunities" was worth +3, enough to single-handedly pass a JOB_BOARD email.
- Added specific rejection phrases (`will not be moving forward`, `not (?:moving|proceeding) forward with your application`) to STRONG_POSITIVE to compensate for removing the over-broad `\bunfortunately\b`.
- JOB_BOARD sources now require `score ≥ 3` (same threshold as unknown senders). The v2 threshold of 1 meant any email from `naukri.com` or `cutshort.io` that mentioned "recruiter" or "candidate" anywhere in the snippet would pass — identical to an ATS, which is wrong. ATS sources keep threshold 1 (they send almost exclusively transactional mail).

**Registry fixes** (`src/parsers/engine/registry.ts`):
- All India and global job board `confirmationPatterns` tightened from single-word alternations (`/applied|application|interview/i`) to specific phrases (`/(?:you(?:'ve| have)?|successfully) applied/i`, `/your application (?:has been|was) (?:submitted|sent|received)/i`, `/interview (?:scheduled|invitation)\b/i`). The bare-word patterns matched literally any email from the domain body containing those words — including newsletters.
- Added `/(?:you(?:'ve| have)?|successfully) applied/i` pattern to all boards; the previous `you've/you have` form missed the common "You applied at Dukaan" subject format.
- Added `\byou applied\b` shortcut to NAUKRI and LINKEDIN entries.
- Expanded NAUKRI `ignorePatterns` with numeric alert patterns (`\d+ (?:new )?(?:jobs?|openings)/i`), city-specific hiring alerts, and date-scoped job digests.

**Gemini rate-limit fix** (`src/parsers/gemini.parser.ts`, `src/parsers/index.ts`):
- LLM trigger condition changed from `(companyWeak || roleWeak)` (confidence < 0.5 on either field) to `(companyMissing && roleMissing)` (both fields null). The previous condition fired for any email where patterns didn't match with high confidence — on a free-tier key (15 RPM) this exhausted the quota on the first sync batch. A card with a real company but "Unknown" role is actionable; "Unknown/Unknown" is not. Gemini is now reserved for emails where deterministic extraction found nothing at all.
- Added a promise-chain serializer (`_enqueue`) in `gemini.parser.ts` that spaces all Gemini calls 6 seconds apart (targeting 10 RPM, under the 15 RPM free-tier cap). Concurrent callers from `gmail.ts`'s `Promise.all()` queue automatically. A post-queue cache check prevents duplicate calls for the same email if it was handled while waiting.

**Files modified in this patch**:
- `src/parsers/engine/triage.ts`
- `src/parsers/engine/registry.ts`
- `src/parsers/index.ts`
- `src/parsers/gemini.parser.ts`

**Verification**: All 72 tests still passing, typecheck clean.

**Commit message (to use when committing all v2 + patch work)**

```
feat(parser): rewrite parsing pipeline for 90%+ accuracy (triage → registry → extraction → gated LLM)

- Add classify-first triage gate: Gmail category labels, alert-sender and
  alert-subject rules, per-source noise/confirmation patterns, weighted
  relevance scoring — job alerts, digests and promos no longer become cards
- Un-block LinkedIn/Wellfound: per-source patterns now accept real
  "Your application was sent to X" confirmations that v1 blanket-ignored
- Add ~40-source registry covering Indian boards (Naukri, Internshala,
  Instahyre, Cutshort, foundit, Hirist, Shine, TimesJobs, Apna), India
  ATS/HRMS (Zoho Recruit, Keka, Darwinbox, Freshteam, TurboHire), global
  ATS (Workday, Greenhouse incl. greenhouse-mail.io, Lever, Ashby,
  SmartRecruiters, iCIMS, Taleo, SuccessFactors, Workable, …) and remote
  boards, with per-source extraction patterns
- Add layered extraction with confidence merging and a validation layer:
  company stoplists (ATS product names can't become companies), role shape
  checks, canonical role map; remove all fabricated defaults
- Wire Gemini as a gated fallback (structured JSON schema, body input,
  isJobApplicationEvent double-check) — called only when deterministic
  extraction finds nothing; lazy init, cache/retry/timeout retained;
  serialized at 10 RPM for free-tier key compatibility
- Enrich parser input with decoded email body + Gmail labelIds (minimal
  gmail.ts touch); fix From-header domain matching (subdomain-safe)
- Fix status classifier: word-boundary regexes and co-occurrence rules so
  "offerings" ≠ OFFER and "thank you for your interest" alone ≠ REJECTION
- Replace v1 parsers/tests with a 46-fixture accuracy corpus asserting
  100% junk rejection, zero dropped confirmations, ≥90% company and ≥85%
  role exact-match — all 72 tests green

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
