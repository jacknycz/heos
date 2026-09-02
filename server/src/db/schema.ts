// HEOS Phase 1 data model (Drizzle + SQLite for local dev).
// Swap to drizzle-orm/pg-core + Postgres for a real deploy — shape stays the same.
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const timestampCol = (sqlName: string) => integer(sqlName, { mode: "timestamp" }).notNull().$defaultFn(() => new Date());
const createdAt = () => timestampCol("created_at");

export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["MANAGER", "MECHANIC", "DRIVER"] }).notNull(),
  createdAt: createdAt(),
});

// The digital passport: one row per machine, everything else hangs off it.
export const machines = sqliteTable("machines", {
  id: id(),
  name: text("name").notNull(), // e.g. "Loader 4" — whatever the fleet calls it
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  serialOrVin: text("serial_or_vin"),
  createdAt: createdAt(),
});

export const repairLogs = sqliteTable("repair_logs", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  mechanicId: text("mechanic_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  costCents: integer("cost_cents").notNull().default(0),
  createdAt: createdAt(),
});

export const driverNotes = sqliteTable("driver_notes", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  driverId: text("driver_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const hoursEntries = sqliteTable("hours_entries", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  enteredById: text("entered_by_id").notNull().references(() => users.id),
  hours: real("hours"),
  distance: real("distance"),
  recordedAt: timestampCol("recorded_at"),
});

export const diagnosticEntries = sqliteTable("diagnostic_entries", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  checklistName: text("checklist_name").notNull(),
  answers: text("answers").notNull(), // JSON-encoded checklist responses
  createdAt: createdAt(),
});

// Standalone parts/cost log — no in-app reordering yet (Phase 3), no supplier integration (Phase 4).
export const parts = sqliteTable("parts", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  repairLogId: text("repair_log_id").references(() => repairLogs.id),
  partNumber: text("part_number").notNull(),
  description: text("description"),
  costCents: integer("cost_cents").notNull().default(0),
  orderedAt: timestampCol("ordered_at"),
  receivedAt: integer("received_at", { mode: "timestamp" }),
});

// Per-machine AI chat, pre-loaded with passport context (Phase 1 scope).
export const chatThreads = sqliteTable("chat_threads", {
  id: id(),
  machineId: text("machine_id").notNull().references(() => machines.id),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: createdAt(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: id(),
  threadId: text("thread_id").notNull().references(() => chatThreads.id),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  // set true once "add this update to the record" has turned this exchange into a real record
  addedToRecord: integer("added_to_record", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});
