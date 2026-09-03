// HEOS data model (Drizzle + Postgres — same engine locally and on Railway).
import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const createdAt = () => timestamp("created_at").notNull().defaultNow();

// The tenant boundary — every fleet's machines and users hang off one organization.
export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // ADMIN controls every other user's role (including other admins) within their organization.
  role: text("role", { enum: ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"] }).notNull(),
  createdAt: createdAt(),
});

// A one-time code an admin hands out so a new teammate can join their organization
// with a preset role, without needing email delivery or deep links.
export const orgInvites = pgTable("org_invites", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  code: text("code").notNull().unique(),
  role: text("role", { enum: ["ADMIN", "MANAGER", "MECHANIC", "DRIVER"] }).notNull(),
  createdByUserId: text("created_by_user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedByUserId: text("used_by_user_id").references(() => users.id),
  createdAt: createdAt(),
});

// The digital passport: one row per machine, everything else hangs off it.
export const machines = pgTable("machines", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(), // e.g. "Loader 4" — whatever the fleet calls it
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  serialOrVin: text("serial_or_vin"),
  createdAt: createdAt(),
});

export const repairLogs = pgTable("repair_logs", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  mechanicId: text("mechanic_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  costCents: integer("cost_cents").notNull().default(0),
  createdAt: createdAt(),
});

export const driverNotes = pgTable("driver_notes", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  driverId: text("driver_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: createdAt(),
});

export const hoursEntries = pgTable("hours_entries", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  enteredById: text("entered_by_id").notNull().references(() => users.id),
  hours: real("hours"),
  distance: real("distance"),
  recordedAt: createdAt(),
});

export const diagnosticEntries = pgTable("diagnostic_entries", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  checklistName: text("checklist_name").notNull(),
  answers: text("answers").notNull(), // JSON-encoded checklist responses
  createdAt: createdAt(),
});

// Standalone parts/cost log — no in-app reordering yet (Phase 3), no supplier integration (Phase 4).
export const parts = pgTable("parts", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  repairLogId: text("repair_log_id").references(() => repairLogs.id),
  partNumber: text("part_number").notNull(),
  description: text("description"),
  costCents: integer("cost_cents").notNull().default(0),
  orderedAt: createdAt(),
  receivedAt: timestamp("received_at"),
});

// Per-machine AI chat, pre-loaded with passport context (Phase 1 scope).
export const chatThreads = pgTable("chat_threads", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: createdAt(),
});

export const chatMessages = pgTable("chat_messages", {
  id: id(),
  threadId: text("thread_id").notNull().references(() => chatThreads.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  // set true once "add this update to the record" has turned this exchange into a real record
  addedToRecord: boolean("added_to_record").notNull().default(false),
  createdAt: createdAt(),
});
