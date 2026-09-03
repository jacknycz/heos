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

**Breaking change for local dev:** the schema changed (new tables, new required columns). Delete
`server/dev.db` (and its `-shm`/`-wal` siblings) and re-run `npm run db:push` — this migration
tool doesn't ALTER existing tables, see the comment in `server/src/db/migrate.ts`.

## Open items / blockers

None currently blocking. Next up: the add-to-record extraction step above; implement PM alert
rules in the hours-entries route; a real `OPENAI_API_KEY` needs to go in `server/.env` before the
chat assistant works beyond the 502 fallback. Worth hardening later (not needed for Phase 1):
move the JWT off AsyncStorage onto `expo-secure-store` for native builds (AsyncStorage isn't
encrypted at rest; used for now since SecureStore doesn't support the web preview target).
