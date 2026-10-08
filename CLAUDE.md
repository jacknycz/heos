# HEOS: working guide for Claude

Read this first. For the product scope and deal terms see [README.md](README.md); for the running
log of what's done, in progress, and blocked see [PROGRESS.md](PROGRESS.md).

## What this is

HEOS (Heavy Equipment Operating System) is a fleet-maintenance and parts-tracking app for a heavy
equipment business. Phase 1 is a fixed-price build: mobile first, online only. Phase 2+ items
(offline, web dashboard, integrations, fleet-wide AI) are deferred, not built. Don't add them
without checking scope first.

## Layout

- `server/`: Express + TypeScript + Drizzle ORM + Postgres. Routes in `server/src/routes`, shared
  helpers in `server/src/lib` (auth, machine context, milestones, OpenAI), schema in
  `server/src/db/schema.ts`.
- `app/`: Expo (React Native) + TypeScript + NativeWind + React Navigation.
  - `app/src/ui/`: the design-system kit. Shared primitives live here.
  - `app/src/screens/`: screens. Passport sub-tabs are in `screens/machinePassport/`.
  - `app/src/navigation/`: tabs (`RootNavigator`, `BottomNav`) and native stacks
    (`MachinesStack`, `SettingsStack`).
  - `app/src/theme/`: `palette.js` (colors), `shadows.ts` (elevation), `colorScheme.ts` (dark mode).
  - `app/src/api/client.ts`: all HTTP calls go through this.

## Design system rules

- **No hardcoded style values.** Colors come from `app/src/theme/palette.js`; shadows come from
  `app/src/theme/shadows.ts`. Add a new value there rather than inlining a hex or shadow props.
- **Reuse the kit first.** Before writing a one-off style, check `ui/`: `Card` (`default`,
  `danger`), `Button` (`primary`, `secondary`, `outline`, `danger`, `ghost`, `fancy`,
  `industrial`), `Tabs` (`text` or `icon` variant), `Sheet`, `Accordion`, `Badge`, `Text` variants.
  A new variant belongs in the shared component, not on one screen.
- **No conflicting Tailwind classes.** Don't put two classes from the same family in one string
  (two `bg-*`, two border widths, two text sizes). Let the component's variant own them.
- **The `/design` page is the visual reference.** Add new components there.
- **Dark mode is manual** (`darkMode: "class"`), toggled in Settings and on `/design`. Every
  color needs a `dark:` pair, or a palette value that works in both.

## Navigation

- Bottom tabs: Dashboard, Machines, Settings. Machines and Settings are native stacks with headers.
- Machine passport (`MachinePassportScreen`): icon tabs for Identity, History, and Parts & Cost.
  Quick Actions and the floating chat button open slide-up sheets, one at a time.
- Editing an existing repair or driver note from History still opens a full-screen form. New
  entries open in sheets.

## Data model

Organizations and users (roles: ADMIN, MANAGER, MECHANIC, DRIVER). Machines, with an optional
location and a tracking unit (hours or miles). Per machine: repair logs, driver notes, hours and
distance entries, diagnostics, parts with receipts, milestones (recurring or one-time), chat
threads and messages, chat summaries, and AI logs. Milestone "due" and "upcoming" come from
`server/src/lib/milestones.ts`.

## Auth and orgs

JWT auth (`requireAuth`), role checks (`requireAdmin`). Every query is scoped to the caller's
organization. Invite codes let new users join an existing org.

## Running locally

- Postgres: the portable instance on port 5433 (`DATABASE_URL` in `server/.env`).
- Server: `cd server && npm run db:migrate && npm run dev` (port 4000).
- App: `cd app && npx expo start --port 8081`, then open `http://localhost:8081` for web.
- Test login: the Nodal org (see PROGRESS.md).

## Migrations

Edit `server/src/db/schema.ts`, run `npm run db:generate` in `server/`, review the generated SQL,
then `npm run db:migrate`. Only add tables or columns unless you've agreed otherwise. Never
truncate the shared local test data without asking.

## Working conventions

- Verify with `npx tsc --noEmit` in `app/` (and `server/`) and a bundle rebuild before reporting
  a change as done. Say plainly what you could not check, such as native rendering.
- Keep to the requested scope. This is a fixed-price project, so don't add features or
  restructure flows that weren't asked for.
- Check with the user before deleting or reshaping an existing flow.

## Known gaps and next steps

- AI logs are saved as-is. Turning them into structured repair logs is not built.
- No user avatars or photos yet.
- Native shadows and text glow still need a check on a device or simulator.
- The dashboard intro is planned for a redesign.
- The `/design` page doesn't yet show `Dropdown` or `SearchField`.
