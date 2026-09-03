// Minimal "push" migration for local dev: creates tables if they don't exist yet.
// Good enough for Phase 1 solo-dev speed — move to drizzle-kit generate/migrate once schema churn slows down.
// Note: this doesn't ALTER existing tables. If you're updating an existing dev.db after a schema
// change, delete it (and its -shm/-wal siblings) and re-run this rather than expecting a migration.
import Database from "better-sqlite3";

const sqlite = new Database(process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS org_invites (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  used_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_or_vin TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS repair_logs (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  mechanic_id TEXT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS driver_notes (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  driver_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS hours_entries (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  entered_by_id TEXT NOT NULL REFERENCES users(id),
  hours REAL,
  distance REAL,
  recorded_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS diagnostic_entries (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  checklist_name TEXT NOT NULL,
  answers TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  repair_log_id TEXT REFERENCES repair_logs(id),
  part_number TEXT NOT NULL,
  description TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  ordered_at INTEGER NOT NULL,
  received_at INTEGER
);

CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES chat_threads(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  added_to_record INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
`);

console.log("HEOS: tables ready at", process.env.DATABASE_URL ?? "./dev.db");
sqlite.close();
