import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
await sql.unsafe(`ALTER TABLE "oidc_clients" ADD COLUMN IF NOT EXISTS "homepage_url" text`);
console.log("Added oidc_clients.homepage_url");

// Best-effort: set MailOG homepage if client exists and empty
await sql.unsafe(`
  UPDATE oidc_clients
  SET homepage_url = 'http://localhost:3000'
  WHERE name ILIKE '%mailog%'
    AND (homepage_url IS NULL OR homepage_url = '')
`);
console.log("Backfilled MailOG homepage_url if present");
await sql.end();
