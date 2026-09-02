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

## Open items / blockers

None currently blocking. Next up: wire `server/src/routes/chat.ts`'s TODOs (LLM call with machine-context injection, "add to record" extraction) to the OpenAI API; enforce role-based auth on routes/screens; implement PM alert rules in the hours-entries route.
