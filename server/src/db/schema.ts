// HEOS data model (Drizzle + Postgres — same engine locally and on Railway).
import { pgTable, text, integer, real, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());
const createdAt = () => timestamp("created_at").notNull().defaultNow();

// The tenant boundary — every fleet's machines and users hang off one organization.
export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // ADMIN controls every other user's role (including other admins) within their organization.
  role: text("role", { enum: ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"] }).notNull(),
  // Expo push token, registered on login when the user grants notification permission — null
  // until then, or on web (no push support there). One token per user, last-login-wins.
  pushToken: text("push_token"),
  createdAt: createdAt(),
});

// A one-time code an admin hands out so a new teammate can join their organization
// with a preset role, without needing email delivery or deep links.
export const orgInvites = pgTable("org_invites", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  code: text("code").notNull().unique(),
  role: text("role", { enum: ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"] }).notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedByUserId: text("used_by_user_id").references(() => users.id),
  createdAt: createdAt(),
});

// A physical site a machine can be based at — org-scoped, optional per machine (Phase 1: name +
// free-text address only, no geocoding/maps).
export const locations = pgTable("locations", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: createdAt(),
});

// The digital passport: one row per machine, everything else hangs off it.
export const machines = pgTable("machines", {
  id: id(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(), // e.g. "Loader 4" — whatever the fleet calls it
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  serialOrVin: text("serial_or_vin"),
  engineNumber: text("engine_number"),
  fleetNumber: text("fleet_number"),
  registrationNumber: text("registration_number"),
  registrationExpiresAt: date("registration_expires_at"),
  // Optional — a machine doesn't have to belong to a location. Deleting a location just clears
  // this on any machine that had it, rather than blocking the delete.
  locationId: text("location_id").references(() => locations.id, { onDelete: "set null" }),
  // Which reading milestones on this machine are measured in — a machine-level choice, not a
  // per-milestone one, since a machine only has one meter that matters (hour meter or odometer).
  trackingUnit: text("tracking_unit", { enum: ["hours", "miles"] })
    .notNull()
    .default("hours"),
  createdAt: createdAt(),
  // Bumped automatically on every update (see machines.ts's PATCH route) — now that a machine
  // can actually be edited, this is real activity for the dashboard's "recently edited
  // machines" section, not just the child-record-timestamp proxy that used to be the only signal.
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const repairLogs = pgTable("repair_logs", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  mechanicId: text("mechanic_id")
    .notNull()
    .references(() => users.id),
  description: text("description").notNull(),
  costCents: integer("cost_cents").notNull().default(0),
  createdAt: createdAt(),
});

export const driverNotes = pgTable("driver_notes", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  driverId: text("driver_id")
    .notNull()
    .references(() => users.id),
  text: text("text").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: createdAt(),
});

export const hoursEntries = pgTable("hours_entries", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  enteredById: text("entered_by_id")
    .notNull()
    .references(() => users.id),
  hours: real("hours"),
  distance: real("distance"),
  recordedAt: createdAt(),
});

// A maintenance rule for a machine, measured against its trackingUnit reading — "recurring"
// fires again every thresholdValue units past the last completion (e.g. every 500 hrs);
// "one_time" fires once at thresholdValue and is done. lastCompletedAtValue/lastCompletedAt
// double duty for both: for recurring they reset the countdown, for one_time their mere
// presence means "done" — see the due-date math in lib/machineContext.ts.
export const milestones = pgTable("milestones", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  label: text("label").notNull(),
  type: text("type", { enum: ["recurring", "one_time"] }).notNull(),
  thresholdValue: real("threshold_value").notNull(),
  lastCompletedAtValue: real("last_completed_at_value"),
  lastCompletedAt: timestamp("last_completed_at"),
  createdAt: createdAt(),
});

export const diagnosticEntries = pgTable("diagnostic_entries", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  checklistName: text("checklist_name").notNull(),
  answers: text("answers").notNull(), // JSON-encoded checklist responses
  createdAt: createdAt(),
});

// Standalone parts/cost log — no in-app reordering yet (Phase 3), no supplier integration (Phase 4).
export const parts = pgTable("parts", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  repairLogId: text("repair_log_id").references(() => repairLogs.id),
  partNumber: text("part_number").notNull(),
  description: text("description"),
  costCents: integer("cost_cents").notNull().default(0),
  orderedAt: createdAt(),
  receivedAt: timestamp("received_at"),
});

// One part/cost entry can have several receipt photos (a multi-page receipt, or a retake of a
// blurry shot without losing the first one) — a child table like every other machine record
// here, rather than a single column, so each photo can be added/deleted independently.
export const partReceipts = pgTable("part_receipts", {
  id: id(),
  partId: text("part_id")
    .notNull()
    .references(() => parts.id),
  // Base64 data URL, stored inline — no file/blob storage exists in this project yet (no S3, no
  // persistent volume on Railway), and this keeps it working identically in local dev and on
  // Railway with zero new infra. Fine for Phase 1 volumes; revisit if photo counts/sizes grow
  // enough that Postgres row bloat becomes a real concern.
  image: text("image").notNull(),
  createdAt: createdAt(),
});

// Per-machine AI chat, pre-loaded with passport context (Phase 1 scope).
export const chatThreads = pgTable("chat_threads", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
});

export const chatMessages = pgTable("chat_messages", {
  id: id(),
  threadId: text("thread_id")
    .notNull()
    .references(() => chatThreads.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  // set true once "add this update to the record" has turned this exchange into a real record
  addedToRecord: boolean("added_to_record").notNull().default(false),
  createdAt: createdAt(),
});

// A durable "what was discussed/advised" log entry, generated on demand ("Save Summary") rather
// than automatically — this project has no scheduler. coveredThroughMessageId marks the last
// message folded into this summary, so the next request only has to summarize what comes after
// it — tracked by message ID rather than its timestamp deliberately: Postgres timestamps carry
// microsecond precision but a JS Date can only hold milliseconds, so reading a message's
// createdAt back out and later comparing chatMessages.createdAt > thatValue would silently
// re-match that same message every time (its own stored value is a few microseconds past the
// truncated copy). Comparing by array position after fetching messages in DB order sidesteps the
// precision loss entirely. machineId is denormalized (not just threadId) so getMachinePassport
// can fetch it the same flat way as every other child table.
export const chatSummaries = pgTable("chat_summaries", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  threadId: text("thread_id")
    .notNull()
    .references(() => chatThreads.id),
  summary: text("summary").notNull(),
  coveredThroughMessageId: text("covered_through_message_id")
    .notNull()
    .references(() => chatMessages.id),
  createdAt: createdAt(),
});

// An "AI Log" entry: an assistant message the user chose to keep on the machine's record. Holds the
// message text as-is for now; a later pass may turn these into structured repair logs.
export const aiLogs = pgTable("ai_logs", {
  id: id(),
  machineId: text("machine_id")
    .notNull()
    .references(() => machines.id),
  sourceMessageId: text("source_message_id")
    .notNull()
    .references(() => chatMessages.id),
  content: text("content").notNull(),
  createdAt: createdAt(),
});
