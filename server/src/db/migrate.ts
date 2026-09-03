// Applies any pending SQL migration files (server/drizzle/*.sql, produced by `npm run db:generate`)
// against DATABASE_URL. Safe to run repeatedly — already-applied migrations are skipped.
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("HEOS: migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
