# CLAUDE.md — hyun-s-service

This file provides AI assistants with the context needed to understand and work
effectively in this codebase.

---

## Project Overview

**hyun-s-service** is a Korean Taekwondo Academy Attendance & Notification System
built as a React single-page application. The system supports three user roles:

| Role      | Korean | Description                                               |
|-----------|--------|-----------------------------------------------------------|
| Admin     | 관리자   | Academy owner — manages students, views attendance logs   |
| Parent    | 학부모   | Receives push notifications when their child checks in/out |
| Kiosk     | 키오스크  | Touchscreen terminal for student attendance check-in/out  |

---

## Technology Stack

| Layer           | Technology                                  |
|-----------------|---------------------------------------------|
| UI Framework    | React 18 + Vite 5                           |
| Auth            | Firebase Authentication                     |
| Database        | Supabase (PostgreSQL + Realtime)            |
| Push Notifs     | Firebase Cloud Messaging (FCM)              |
| Edge Functions  | Supabase Edge Functions (Deno/TypeScript)   |
| Deployment      | Netlify (static hosting)                    |
| Package Manager | npm                                          |

---

## Repository Structure

```
hyun-s-service/
├── public/
│   ├── _redirects               # Netlify SPA routing: /* → /index.html
│   └── firebase-messaging-sw.js # Service worker for background push notifications
├── sql/
│   ├── supabase_setup.sql       # Initial schema — students, attendance, notifications
│   └── supabase_update_v2.sql   # Migration — adds academies table + academy_id FK
├── src/
│   ├── App.jsx                  # ENTIRE app in one file (~905 lines)
│   ├── main.jsx                 # React entry: renders <TaekwondoApp />
│   ├── index.css                # Global styles, fonts, keyframe animations
│   └── lib/
│       ├── firebase.js          # Firebase init, FCM token helper, notification sender
│       └── supabase.js          # Supabase client init
├── supabase/
│   └── functions/
│       └── send-fcm/
│           └── index.ts         # Edge Function: sends FCM on attendance INSERT
├── index.html                   # App shell — title: "태권도장 알림 시스템"
├── vite.config.js               # Vite config (base: './', React plugin)
├── package.json
└── build_log.txt                # Previous build output (informational only)
```

---

## Key Source Files

### `src/App.jsx`

The entire application lives in this single file. Main components and helpers:

- **`createNotification()`** — Helper that formats notification objects
- **`AdminLoginScreen`** — Admin sign-up / sign-in form (Firebase Auth)
- **`TaekwondoApp`** — Root component; manages auth state, Supabase subscriptions,
  role routing, and attendance operations
- **`LoginScreen`** — Role selection UI (Admin / Parent / Kiosk)
- **`AdminView`** — Dashboard: student list, attendance records, notification history
- **`ParentView`** — Parent portal: child attendance history, notifications received
- **`KioskView`** — Touchscreen numberpad for check-in (등원) / check-out (하원)

**Patterns to be aware of:**
- All state and data fetching is done with `useState` / `useEffect` inside
  `TaekwondoApp`; child components receive data and callbacks as props
- Supabase Realtime subscriptions are established in `useEffect` and cleaned up
  on unmount
- All styling is **inline CSS** (no CSS modules, no Tailwind); the primary accent
  color is `#C41E3A` (taekwondo red)
- All UI text is in **Korean**

### `src/lib/firebase.js`

- Reads Firebase config from `VITE_FIREBASE_*` environment variables
- Exports `messaging`, `auth` instances
- `requestForToken()` — requests FCM device token
- `onMessageListener()` — foreground notification listener
- `sendPushNotification()` — calls FCM Legacy HTTP API (used from client)

### `src/lib/supabase.js`

- Initialises and exports the Supabase JS client using `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`

### `supabase/functions/send-fcm/index.ts`

- Deno edge function triggered by a Supabase database webhook on attendance INSERT
- Looks up student → fetches FCM token → calls FCM HTTP v1 API
- Requires secrets: `FIREBASE_SERVICE_ACCOUNT`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`

---

## Database Schema

### Tables (Supabase / PostgreSQL)

#### `academies`
| Column       | Type        | Notes                       |
|--------------|-------------|-----------------------------|
| id           | UUID PK     | Matches Firebase Auth UID   |
| name         | TEXT        |                             |
| admin_email  | TEXT UNIQUE |                             |
| created_at   | TIMESTAMPTZ |                             |

#### `students`
| Column      | Type        | Notes                         |
|-------------|-------------|-------------------------------|
| id          | BIGINT PK   |                               |
| academy_id  | UUID FK     | → academies.id                |
| number      | TEXT UNIQUE | 2-digit code used at kiosk    |
| name        | TEXT        |                               |
| age         | INTEGER     |                               |
| parent      | TEXT        | Parent name                   |
| phone       | TEXT        |                               |
| belt        | TEXT        | Taekwondo rank                |
| active      | BOOLEAN     | Default true                  |
| fcm_token   | TEXT        | Parent's FCM device token     |
| created_at  | TIMESTAMPTZ |                               |

#### `attendance`
| Column       | Type        | Notes                              |
|--------------|-------------|------------------------------------|
| id           | BIGINT PK   |                                    |
| academy_id   | UUID FK     | → academies.id                     |
| student_id   | BIGINT FK   | → students.id                      |
| student_name | TEXT        |                                    |
| number       | TEXT        |                                    |
| type         | TEXT        | '등원' (arrival) or '하원' (departure) |
| time         | TEXT        |                                    |
| date         | TEXT        |                                    |
| created_at   | TIMESTAMPTZ |                                    |

#### `notifications`
| Column       | Type        | Notes             |
|--------------|-------------|-------------------|
| id           | BIGINT PK   |                   |
| academy_id   | UUID FK     | → academies.id    |
| student_id   | BIGINT FK   | → students.id     |
| student_name | TEXT        |                   |
| parent_name  | TEXT        |                   |
| type         | TEXT        | '등원' or '하원'    |
| time         | TEXT        |                   |
| message      | TEXT        |                   |
| created_at   | TIMESTAMPTZ |                   |

All tables are included in the `supabase_realtime` publication. RLS is enabled
with permissive policies (all CRUD for anon role) — enforce stricter policies
before production use.

---

## Environment Variables

Create a `.env` file in the project root with these variables:

```dotenv
# Supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_FIREBASE_FCM_SERVER_KEY=
```

> **Note:** `public/firebase-messaging-sw.js` currently has **hardcoded** Firebase
> config values. Before deploying to production, inject the real values (or
> implement a build-step substitution).

---

## Development Workflow

### Prerequisites

- Node.js ≥ 18
- npm
- A Supabase project (run `sql/supabase_setup.sql` then `sql/supabase_update_v2.sql`)
- A Firebase project (Auth + Cloud Messaging enabled)

### Common Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Lint (zero-warning policy)
npm run lint

# Production build → dist/
npm run build

# Preview production build locally
npm run preview
```

### Database Setup

1. Open the Supabase SQL editor for your project
2. Run `sql/supabase_setup.sql` (creates tables, enables realtime, adds sample data)
3. Run `sql/supabase_update_v2.sql` (adds multi-academy support)

### Supabase Edge Function Deployment

```bash
supabase functions deploy send-fcm

# Set required secrets
supabase secrets set FIREBASE_SERVICE_ACCOUNT='<json>'
supabase secrets set SUPABASE_URL='https://<project>.supabase.co'
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='<key>'
```

---

## Code Conventions

- **Language:** JavaScript (`.jsx`) for React source; TypeScript (`.ts`) for Edge
  Functions
- **Styling:** Inline CSS objects only — no external CSS frameworks, no CSS
  modules; use the existing `#C41E3A` accent colour where appropriate
- **UI Language:** All user-facing text must be in **Korean**
- **Component structure:** Keep components inside `src/App.jsx` unless the file
  grows unmanageable; if splitting, create files under `src/components/`
- **State management:** Local React state + Supabase Realtime — no Redux or
  external state library
- **No test framework is configured** — test manually via the dev server

---

## Deployment

- Build artefacts go to `dist/` via `npm run build`
- `public/_redirects` routes all paths to `index.html` for Netlify SPA support
- Set environment variables in the Netlify dashboard (Settings → Environment)
- The service worker (`firebase-messaging-sw.js`) must be reachable at the root
  URL for push notifications to work

---

## Known Issues / TODOs

- `public/firebase-messaging-sw.js` has hardcoded Firebase credentials — replace
  with real values or a build-time substitution before going to production
- RLS policies are permissive (allow all for anon) — tighten before production
- No automated tests — consider adding Vitest
- No CI/CD pipeline — consider adding GitHub Actions
- `googleapis` package is listed as a production dependency but may only be needed
  in the Edge Function (which uses Deno, not npm)
