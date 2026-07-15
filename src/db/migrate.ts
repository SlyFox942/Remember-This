/**
 * Simple migration runner for Neon Postgres.
 *
 * Reads .sql files from `src/db/migrations/` sorted by name, tracks which have
 * already been applied in a `_migrations` table, and runs new ones in order.
 *
 * Usage:
 *   bun run src/db/migrate.ts          # run all pending migrations
 *   bun run src/db/migrate.ts -- dry   # dry-run (list pending, don't apply)
 */

import { sql } from "./db";
import * as fs from "node:fs";
import * as path from "node:path";

const MIGRATIONS_DIR = path.join(import.meta.dirname ?? __dirname, "migrations");

async function ensureTrackingTable() {
  await sql()`CREATE TABLE IF NOT EXISTS _migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
}

async function getApplied(): Promise<Set<string>> {
  const rows = await sql()`SELECT name FROM _migrations ORDER BY name`;
  return new Set(rows.map((r: { name: string }) => r.name));
}

async function main() {
  const dryRun = process.argv.includes("--dry") || process.argv.includes("dry");

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("No migrations directory found. Nothing to do.");
    return;
  }

  await ensureTrackingTable();
  const applied = await getApplied();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("All migrations are up to date.");
    return;
  }

  console.log(
    dryRun ? `[DRY RUN] Would apply ${pending.length} migration(s):` : `Applying ${pending.length} migration(s):`,
  );

  for (const file of pending) {
    console.log(`  ${dryRun ? "[DRY RUN] " : ""}${file}`);

    if (!dryRun) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      await sql().unsafe(content);
      await sql()`INSERT INTO _migrations (name) VALUES (${file})`;
    }
  }

  console.log(dryRun ? "Dry run complete. No changes made." : "Migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
