# HEOS — Heavy Equipment Operating System

Fleet maintenance / parts-tracking app for a heavy equipment business. Phase 1 MVP: mobile only,
online only. Full scope, acceptance criteria, and hour breakdowns live in
`HEOS_Scope_of_Work_v0.15.docx` (kept outside this repo — ask Jack for the current copy).

## The deal

Phase 1 is a fixed-price $9k build, scoped to land near 120 hours (range 90–150). Client is open to
an ongoing phased-delivery relationship — later phases get scoped and priced separately once Phase 1
ships and is accepted.

## Structure

- `/server` — Node + TypeScript + Express + Drizzle ORM. SQLite for local dev; swap the Drizzle
  driver to Postgres for a real deploy (schema shape stays the same). Drizzle was chosen over Prisma
  because Prisma's engine-binary download was unreliable in a constrained sandbox — plain npm
  packages only.
- `/app` — Expo (React Native + TypeScript) mobile app, iOS + Android from one codebase.

## Phase 1 scope

Multi-organization from the ground up: an organization has multiple users, always has at least one
admin, and an admin controls every other user's role (including other admins) within their own
organization — see [PROGRESS.md](PROGRESS.md) for how that's modeled and enforced.

Digital passport per machine (identity + full repair/maintenance/order history), repair &
maintenance logging, driver notes/issue reporting (typed only), manual hours & distance entry,
diagnostics via guided checklists (not free text/fault codes), parts & cost log with repeat-order
flagging (no in-app reordering yet), preventative-maintenance alerts, a mobile manager dashboard, and
a per-machine AI chat assistant (pre-loaded with that machine's context; "add this update to the
record" turns a chat exchange into a real log entry).

**Explicitly deferred:**
- Web/browser dashboard, voice-to-text, in-app reordering → Phase 3
- Offline support → Phase 2 (scoped narrowly: cached read-only machine list + "dock an update" to
  sync later — no full offline access)
- Supplier/telematics integrations → Phase 4
- Fleet-wide-learning AI, marketplace/PM-Kits vision → Phase 5 (not built, not estimated)

## Getting started

### Server
```
cd server
npm install
cp .env.example .env   # then set JWT_SECRET (and OPENAI_API_KEY if testing chat)
npm run db:push
npm run dev
```
Runs on `:4000` by default. First use: `POST /auth/signup-organization` to create an organization
and its first admin, or open the app and use "Create a new organization" from the login screen.

### App
```
cd app
npm install
npx expo start
```

## Status

See [PROGRESS.md](PROGRESS.md) for a running log of what's done, in progress, and blocked.
