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

## Open items / blockers

- AI provider not picked yet (OpenAI vs. Anthropic vs. other) — affects the chat assistant work; doesn't block anything else.
