# Build Progress Log

Running log of what's done, in progress, and blocked — kept up to date so Jack can check in async.

## 2026-09-02 — Day 1: Base app setup

- [x] Repo scaffolded: `/server` (Node + TS + Express + Drizzle ORM) and `/app` (Expo React Native + TS)
- [x] Data model drafted (Drizzle schema): User, Machine (passport), RepairLog, DriverNote, HoursEntry, DiagnosticEntry, Part, ChatThread, ChatMessage
- [x] Machine passport read endpoint + screen wired end-to-end (identity + repair/note/parts history)
- [x] CRUD routes for repair logs, driver notes, hours/distance entries, diagnostics, parts (with repeat-order detection)
- [x] Nav shell in app with the full Phase 1 screen set (list/passport/dashboard/settings + one form screen per log type)
- [ ] Role-based auth is modeled in the schema (`users.role`) but not yet enforced on routes/screens
- [ ] Preventative-maintenance alert rules (hours-entry route has a TODO to evaluate against latest hours/distance)
- [ ] AI chat assistant integration (context injection + LLM call + add-to-record extraction — routes are stubbed with TODOs)
- [ ] Manager dashboard (mobile) — screen exists, needs real data wired in

## 2026-09-02 — Repo consolidated

- [x] Moved out of a loose OneDrive folder and into this git repo, initial commit made — resolves the "where does this code live" blocker from Day 1
- [x] README rewritten to match actual stack (Drizzle, not Prisma — Day 1 log had drifted)
- [x] Verified clean install + boot from the new location: `server` installs, `db:push` creates tables, `/health` and `/machines` respond; `app` installs and typechecks clean
- [x] Fixed this machine's dev environment: Node v25 had no prebuilt `better-sqlite3` binary, so `npm install` in `/server` needed Python + Visual Studio Build Tools (C++ workload) installed to compile it from source — both installed, install now goes through clean
- [x] AI provider decided: **OpenAI**, per customer preference — unblocks the chat assistant work
- [x] AI chat assistant wired to OpenAI (`gpt-4o-mini` by default, configurable via `OPENAI_CHAT_MODEL`): the machine passport is flattened into a system prompt for context injection, conversation history is replayed on each turn, and OpenAI failures (no key, API error) return a clean 502 instead of losing the user's message
- [x] Fixed a reliability gap found while testing the above: any thrown/rejected route error (bad foreign key, downstream API failure) was crashing the *entire* server process, not just failing that request — added a global error handler (`express-async-errors` + error middleware in `server/src/index.ts`) so the API survives bad requests now
- [ ] "Add this update to the record" is still a stub — it marks the chat message as added but doesn't yet extract a structured RepairLog/DriverNote from it

## 2026-09-03 — Multi-organization + real auth

Reworked the data model from the ground up for multi-tenancy: HEOS now supports multiple
organizations, each with multiple users, each organization has at least one ADMIN, and an ADMIN
can change any other user's role (including another admin's) within their own organization.

- [x] New `organizations` and `org_invites` tables; `users` and `machines` now carry `organizationId` — every fleet record is scoped to one tenant
- [x] Role enum extended to `ADMIN | MANAGER | MECHANIC | DRIVER`
- [x] Real auth: email+password (bcryptjs, no native build step) + JWT bearer tokens. `POST /auth/signup-organization` bootstraps a new org with its first admin; `POST /auth/login` signs in
- [x] Invite-code flow: an admin mints a single-use code via `POST /users/invites` (role preset, 7-day expiry), shares it manually (no email delivery), and the invitee redeems it via `POST /auth/accept-invite`
- [x] `PATCH /users/:id/role` (admin-only) changes any teammate's role; blocked if it would leave the organization with zero admins
- [x] Every fleet route now requires auth and is scoped to the caller's organization — verified two separate orgs can't see or write each other's machines/threads/messages even by guessing IDs
- [x] App: Login/Create-Organization/Accept-Invite screens, a Team screen (Settings → Manage Team) for admins to invite teammates and change roles, and a persisted session (AsyncStorage) so the app reopens signed in
- [x] Found and fixed a bug while testing: the JWT originally carried the user's role from login time, so a role change didn't take effect until the affected user logged out and back in — `requireAuth` now looks up the live role from the DB on every request instead

**Breaking change for local dev (superseded by the Postgres switch below):** at the time, this
meant deleting `server/dev.db` and re-running `db:push`. SQLite is gone now — see the next entry.

## 2026-09-03 — Hosting decided: Railway, moved onto real Postgres migrations

Jack's handing this off to the customer eventually, so hosting needed to be decided now rather
than bolted on later. Went with **Railway** for both the server and the database:

- One project, one dashboard, one bill — Railway hosts the Express server and Postgres together
  and auto-deploys from this GitHub repo on push.
- Two environments in the same project, `staging` and `production`, each with its own Postgres.
  Chose *not* to auto-sync staging into production — staging will accumulate test orgs/junk data,
  so when the customer's pilot data is ready to go live, the plan is a deliberate one-time
  `pg_dump` from staging → scrub obvious test data → `pg_restore` into production. Same provider,
  standard Postgres tooling, no cross-vendor migration.
- Account ownership starts with Jack; transferring the Railway project to the customer later (if
  wanted) is a built-in one-click operation, so that decision doesn't block getting started.

This forced the real blocker: the server was SQLite-only (`better-sqlite3`), and the schema was
applied via a hand-rolled `CREATE TABLE IF NOT EXISTS` script that can't safely alter a live
database. Both are fixed now:

- [x] Switched the whole stack to Postgres — same engine locally and on Railway, so there's no
      SQLite/Postgres dialect drift to manage. Driver is `postgres` (postgres.js, pure JS — no
      native build step, consistent with the bcryptjs/Drizzle-over-Prisma pattern on this repo)
- [x] Schema rewritten from `drizzle-orm/sqlite-core` to `drizzle-orm/pg-core` (booleans and
      timestamps are now native Postgres types instead of SQLite's integer-mode emulation)
- [x] Real migration workflow: `npm run db:generate` (drizzle-kit diffs `schema.ts` against
      `server/drizzle/*.sql` history and writes a new migration file — review and commit it) and
      `npm run db:migrate` (applies pending migrations to `DATABASE_URL`, safe to re-run). `npm
      run db:push` still exists for fast local-only iteration, not for shared databases
- [x] Generated and reviewed the initial migration (`server/drizzle/0000_*.sql`) — 11 tables, all
      FKs and unique constraints present and correct
- [x] Verified against a real local Postgres instance (installed for this purpose): migration
      applies cleanly, and the full signup/login/invite/role-change/machine/chat flow from the
      2026-09-03 multi-org entry above still passes end-to-end on Postgres
- [x] Pushed to `origin` (`github.com/jacknycz/heos`) so Railway can deploy straight from the repo

## 2026-09-03 — Design system: NativeWind + a real component kit

The app had no UI foundation — raw RN primitives (`View`/`Text`/`Button`), inline `style={{}}`
objects per screen, no theme, no reusable components, hand-rolled form state with no validation
feedback. Fine for proving data flows in Phase 1, not something to keep building a large app on.

- [x] NativeWind (Tailwind for RN) with semantic color tokens aliased onto Tailwind's own scales
      (`primary`/`danger`/`success`/`warning`/`neutral` → `colors.blue`/`red`/`green`/`amber`/`slate`
      in `app/tailwind.config.js`) — swap the alias, not the components, to rebrand later
- [x] Internal component kit in `app/src/ui/`: `Text` (5 typography variants), `Button` (5 variants
      × 2 sizes, loading state), `FormField` (react-hook-form-integrated input with inline error),
      `Card`, `Screen` (safe-area + consistent padding), `EmptyState`, `Badge` (role/status pills)
- [x] Forms switched from hand-rolled `useState` per field to `react-hook-form` + `zod` schemas
      (`app/src/schemas/`) — real inline validation now (a red border + message under the specific
      invalid field), not a single generic error string at the top
- [x] Every existing screen retrofitted onto the kit: both auth flows, machine list/passport,
      dashboard, settings, team management, all four logging forms, chat

Getting NativeWind working on Expo SDK 51 / RN 0.74.5 (old architecture) took two real fixes —
see [[project-heos-nativewind-setup]] in memory for the full detail, short version: npm's peer-dep
auto-install pulled in Reanimated 4.x (needs the New Architecture), which nested a second copy of
`react-native` and broke NativeWind's `className` type augmentation; and `nativewind@4.2.x`'s
Metro transformer unconditionally requires the newer worklets package. Fixed by explicitly
installing the Expo-compatible `react-native-reanimated@~3.10.1`, adding `legacy-peer-deps=true`
to `app/.npmrc`, and pinning `nativewind@4.1.23` (the last release built for Reanimated 3.x).

- [x] Verified against the running app, not just typechecked: logged in as the Nodal test admin,
      navigated machine list → passport → chat → back, and triggered a real form validation error,
      all via a real browser driving the Expo web build. Zero console errors.

## 2026-09-03 — Railway API live; added a static web staging preview

Jack got the Railway project running. Hit the expected first-boot error (`DATABASE_URL` not set —
no Postgres attached yet) and, after that, `Cannot GET /` when checking the API in a browser —
both expected: the former needed a Postgres plugin attached, the latter is just Express's normal
404 for `GET /` on a JSON API that only defines `/health` and the resource routes, not a bug.

Then: "I want a staging site I can look at while I'm not at home." The app is mobile-first, but
there was no way to check on it except running a local dev server on the same network. Added a
static web export path:

- [x] `npm run build:web` (`expo export --platform web`) produces a static `dist/` bundle;
      `npm run start:web` (`serve dist -s -l $PORT`) serves it — added `serve` as a dependency
- [x] Verified the full pipeline locally end-to-end (not just the build step): built the static
      export, served it exactly as Railway would, and drove it with a real browser — login,
      real API call, navigation to the machine list, zero console errors
- [ ] Not yet deployed to Railway as a second service — see README's Hosting section for the exact
      setup (root directory `app`, build/start commands above, `EXPO_PUBLIC_API_URL` set as a
      **build-time** variable since Expo bakes public env vars into the bundle, not read at runtime)

This is a preview convenience only, not the real distribution story — actual users get the app via
Expo Go (dev) or an EAS build submitted to TestFlight/Play, neither set up yet.

## 2026-09-10 — Machine passport restructured into tabs

The passport screen (`app/src/screens/MachinePassportScreen.tsx`) was one long scroll of stacked
cards. Split it into four tabs (Identity / History / Parts & Cost / Chat, `app/src/screens/machinePassport/`)
sitting below the existing quick-action buttons, which stayed put:

- [x] Identity: make/model/year/serial. **ADDITIONAL FIELDS NEEDED**: trim and at-a-glance
      equipment specs (horsepower, operating weight, etc.) were asked for but the `machines`
      table has no columns for them yet — revisit once it's clear which specs actually matter
      per manufacturer, then migrate.
- [x] History: repairs, driver notes, hours/distance entries, and diagnostics merged into one
      chronological timeline instead of four separate lists — nothing machine-related requires
      hunting through a different section anymore.
- [x] Parts & Cost: every part tied to the machine plus a running total (parts costs only, not
      combined with repair labor costs — kept as two separate concerns).
- [x] Chat: pulled out of its own pushed stack screen (`ChatThreadScreen`, deleted) and made a
      tab. Fixed a real bug in the process: the old screen kept `threadId` only in local state,
      so leaving and reopening chat silently started a brand-new empty thread every time — added
      `GET /chat/threads?machineId=` so a machine's ongoing conversation actually resumes.
- [x] All four tabs read off one passport fetch and stay mounted (hidden, not unmounted) when you
      switch tabs, so nothing resets and logging anything via the quick-actions refreshes every
      tab at once on return — no per-tab fetching to keep in sync.
- [ ] Chat's "add this update to the record" is still the pre-existing stub (marks the message as
      added, doesn't extract a real RepairLog/DriverNote) — real extraction is a deliberately
      separate follow-up, not done here.

## 2026-09-13 — Maintenance milestones + PM alerts (finally closes that hours-entries TODO)

The hours-entries route had carried a "TODO: evaluate PM alert rules" comment since Day 1. Built
the actual feature: milestones (a machine-level rule like "every 500 hrs, fluids check"), plus
real alerting on top.

- [x] Each machine now has a `trackingUnit` (hours or miles) — a machine-level choice, since a
      machine only has one meter that matters. Set on the machine form, shown on Identity.
- [x] New `milestones` table: a rule per machine, either `recurring` (fires again every N units
      past the last completion) or `one_time` (fires once at N and is done) — both types were
      asked for, so both are supported per-milestone, not a global setting.
- [x] hours-entries are cumulative meter readings (like an odometer), not deltas — a machine's
      "current value" is just its latest entry. Every new entry is checked against that machine's
      milestones for anything newly crossed.
- [x] New "Milestones" tab (5th tab on the passport) — create/edit/delete a milestone, "Mark
      Done" (resets a recurring one's countdown; finishes a one-time one for good), each with a
      due/upcoming/done badge computed from the current reading.
- [x] History timeline also shows milestones: a due/overdue banner up top (they don't have a real
      date until completed, so they don't fit the date-ordered line), and completed ones appear
      in the timeline itself at their actual completion reading.
- [x] Dashboard: a "machines due for maintenance" alert section, tapping one deep-links straight
      to that machine's Milestones tab (`initialTab` param) instead of always opening on Identity.
- [x] Push notifications via `expo-notifications` + `expo-server-sdk` (Expo's own push service,
      no third-party provider) — a newly-due milestone pushes every ADMIN/MANAGER in the org with
      a registered token. Token registered on login/session-restore, cleared on logout.
- [ ] **No EAS project is configured for this app yet** — `getExpoPushTokenAsync()` needs a real
      `projectId` to actually get a token; without one it throws, which is caught (logged, not
      fatal) so login/signup never breaks over it, but push silently never fires until `eas init`
      is run. Same shape of gap as the missing `OPENAI_API_KEY` — flagging it, not blocking on it.
      Also untestable in the web preview at all (no push support in a browser) or in Expo Go on
      some SDKs — needs a real device/dev build to verify once the EAS project exists.

## History timeline redesign (same day)

Also asked for while building the above: History's flat list of cards became a real timeline —
a dot-and-connecting-rail down the left, one continuous line instead of four visually-identical
sections stacked on top of each other.

## 2026-09-14 — Daily chat summaries → machine History, and OPENAI_API_KEY finally set locally

The per-machine AI chat has worked all along (OpenAI-backed, resumable thread, primed with the
full passport), but nothing about a conversation showed up anywhere else on the machine's record.
Added a way to close that loop, plus got local chat actually working end-to-end for the first
time.

- [x] `OPENAI_API_KEY` was sitting in the *old* pre-consolidation OneDrive copy of this repo
      (`C:\Users\jackn\OneDrive\Documents\HEOS_app_code\server\.env`) the whole time, not the real
      one at `server/.env` this project actually runs from — copied it over, server restarted
      (`.env` is read once at process start; editing it doesn't hot-reload). Chat and summaries
      are now verified working against the real API, not just the 502 fallback path.
- [x] New "Save Summary" button in the Chat tab — explicit, not automatic (no scheduler in this
      project). Folds every message since the last summary (or the whole thread, if none exists
      yet) into one third-person factual log entry via a second OpenAI call, stored in a new
      `chat_summaries` table, and shown in History as its own timeline entry ("AI Summary").
- [x] **Found and fixed a real bug while testing, not just the "nothing new" happy path**: the
      first cut tracked "what's already been summarized" via a `coveredThroughAt` timestamp
      copied from a message's `createdAt`. Postgres timestamps carry microsecond precision; a JS
      `Date` only holds milliseconds. Reading that value out and writing it back always truncated
      it slightly *below* the real stored value, so `createdAt > coveredThroughAt` matched that
      same already-summarized message again on every single call — three "Save Summary" taps in a
      row produced three summaries of the identical batch, not three distinct ones. Fixed by
      tracking the cutoff by `coveredThroughMessageId` (an actual message row) instead and slicing
      by array position after fetching messages in DB order — sidesteps timestamp precision
      entirely. Verified with two real chat rounds producing two summaries with genuinely
      non-overlapping content, and a same-batch retry correctly rejected with no duplicate entry.
- [x] Not touched, deliberately: `POST /chat/messages/:id/add-to-record` (the older, separate
      per-message stub — still just marks a message as added, still no real extraction into a
      RepairLog/DriverNote). This is a different feature from the new daily-summary one.

## Open items / blockers

None currently blocking. Next up on the product side: the add-to-record extraction step from the
chat entry above; trim/specs fields on the machine passport's Identity tab; running `eas init` so
push notifications actually deliver (see the milestones entry). Now that a real `OPENAI_API_KEY`
is set locally, the same key needs to go into each Railway environment's vars before the chat
assistant works there too — it's still only set in local `server/.env`. Next up on hosting: deploy
the static web preview service above. Worth hardening later (not needed for Phase 1): move
the JWT off AsyncStorage onto `expo-secure-store` for native builds (AsyncStorage isn't encrypted
at rest; used for now since SecureStore doesn't support the web preview target).
