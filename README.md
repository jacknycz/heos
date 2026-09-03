# HEOS — Heavy Equipment Operating System

Fleet maintenance / parts-tracking app for a heavy equipment business. Phase 1 MVP: mobile only,
online only. Full scope, acceptance criteria, and hour breakdowns live in
`HEOS_Scope_of_Work_v0.15.docx` (kept outside this repo — ask Jack for the current copy).

## The deal

Phase 1 is a fixed-price $9k build, scoped to land near 120 hours (range 90–150). Client is open to
an ongoing phased-delivery relationship — later phases get scoped and priced separately once Phase 1
ships and is accepted.

## Structure

- `/server` — Node + TypeScript + Express + Drizzle ORM + Postgres. Same database engine locally
  and in production (Railway) — no dialect drift to worry about. Drizzle was chosen over Prisma
  because Prisma's engine-binary download was unreliable in a constrained sandbox — plain npm
  packages only (this also steered the auth work: bcryptjs instead of native `bcrypt`).
- `/app` — Expo (React Native + TypeScript) mobile app, iOS + Android from one codebase.

## Hosting

Railway, for both environments: one project with a `staging` and a `production` environment, each
with its own Postgres. Rationale and the staging→production data-promotion plan are in
[PROGRESS.md](PROGRESS.md) (2026-09-03 entry). Deploying: point a Railway service at this repo with
root directory `server`, add a Postgres plugin to the same environment (Railway injects
`DATABASE_URL` automatically), set the other vars from `.env.example` (`JWT_SECRET`,
`OPENAI_API_KEY`, etc.) in Railway's dashboard, and run `npm run db:migrate` once (Railway's shell,
or as a pre-deploy step) to create the schema.

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
Needs a Postgres database — set `DATABASE_URL` in `.env` to a local Postgres instance or a Railway
one.
```
cd server
npm install
cp .env.example .env   # set DATABASE_URL, JWT_SECRET (and OPENAI_API_KEY if testing chat)
npm run db:migrate      # applies the SQL files in server/drizzle/ to DATABASE_URL
npm run dev
```
Runs on `:4000` by default. First use: `POST /auth/signup-organization` to create an organization
and its first admin, or open the app and use "Create a new organization" from the login screen.

Schema changes: edit `server/src/db/schema.ts`, then `npm run db:generate` to produce a new SQL
migration file (review it, commit it), then `npm run db:migrate` to apply it. `npm run db:push` is
also available for fast local-only iteration (syncs the schema straight to your DB, no migration
file) — don't use it against a shared database.

### App
```
cd app
npm install
npx expo start
```

## Status

See [PROGRESS.md](PROGRESS.md) for a running log of what's done, in progress, and blocked.
