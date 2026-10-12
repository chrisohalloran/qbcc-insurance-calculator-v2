import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

if (!databaseUrl) {
  console.error("Set DATABASE_URL or POSTGRES_URL before running db:migrate.");
  process.exit(1);
}

const migrationPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../db/migrations/001_init.sql",
);
const sqlText = readFileSync(migrationPath, "utf8");
const statements = sqlText
  .split(";")
  .map((statement) =>
    statement
      .split("\n")
      .map((line) => line.replace(/--.*$/, "").trimEnd())
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

const sql = neon(databaseUrl);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} statements from ${migrationPath}`);
