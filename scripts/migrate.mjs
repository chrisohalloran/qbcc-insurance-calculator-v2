import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

if (!databaseUrl) {
  console.error("Set DATABASE_URL or POSTGRES_URL before running db:migrate.");
  process.exit(1);
}

const migrationsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../db/migrations",
);
const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const sql = neon(databaseUrl);
let applied = 0;

for (const file of files) {
  const sqlText = readFileSync(resolve(migrationsDir, file), "utf8");
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

  for (const statement of statements) {
    await sql.query(statement);
    applied += 1;
  }
  console.log(`Applied ${statements.length} statements from ${file}`);
}

console.log(`Applied ${applied} statements from ${files.length} migrations`);
