import postgres from "postgres";
const connectionString = process.env.DATABASE_URL || "postgres://mbx:nopassword123!@10.100.10.5:5432/sso_db";
const sql = postgres(connectionString);
async function main() {
  console.log("Applying migration 0002_mighty_jackpot.sql...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "sites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "code" varchar(50) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "address" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "sites_code_unique" UNIQUE("code")
      )
    `;
    console.log("\u2705 Created sites table");
    await sql`CREATE INDEX IF NOT EXISTS "sites_code_idx" ON "sites" USING btree ("code")`;
    await sql`CREATE INDEX IF NOT EXISTS "sites_is_active_idx" ON "sites" USING btree ("is_active")`;
    console.log("\u2705 Created sites indexes");
    const divisionsHasSiteId = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'divisions' AND column_name = 'site_id'
    `;
    if (divisionsHasSiteId.length === 0) {
      const existingSites = await sql`SELECT id FROM sites LIMIT 1`;
      let defaultSiteId;
      if (existingSites.length === 0) {
        const [defaultSite] = await sql`
          INSERT INTO sites (code, name, description, is_active)
          VALUES ('DEFAULT', 'Default Site', 'Default site created during migration', true)
          RETURNING id
        `;
        defaultSiteId = defaultSite.id;
        console.log("\u2705 Created default site");
      } else {
        defaultSiteId = existingSites[0].id;
        console.log("\u2705 Using existing site as default");
      }
      await sql`ALTER TABLE "divisions" ADD COLUMN IF NOT EXISTS "site_id" uuid`;
      console.log("\u2705 Added site_id column to divisions");
      await sql`UPDATE divisions SET site_id = ${defaultSiteId} WHERE site_id IS NULL`;
      console.log("\u2705 Updated existing divisions with default site");
      await sql`ALTER TABLE "divisions" ALTER COLUMN "site_id" SET NOT NULL`;
      console.log("\u2705 Made divisions.site_id NOT NULL");
      try {
        await sql`
          ALTER TABLE "divisions" 
          ADD CONSTRAINT "divisions_site_id_sites_id_fk" 
          FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE cascade ON UPDATE no action
        `;
      } catch (e) {
        if (!e.message.includes("already exists")) throw e;
      }
      await sql`CREATE INDEX IF NOT EXISTS "divisions_site_id_idx" ON "divisions" USING btree ("site_id")`;
      console.log("\u2705 Added divisions-sites foreign key and index");
    } else {
      console.log("\u23ED\uFE0F  divisions.site_id already exists");
    }
    const unitsHasSiteId = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'units' AND column_name = 'site_id'
    `;
    if (unitsHasSiteId.length === 0) {
      const [defaultSite] = await sql`SELECT id FROM sites LIMIT 1`;
      const defaultSiteId = defaultSite.id;
      await sql`ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "site_id" uuid`;
      console.log("\u2705 Added site_id column to units");
      await sql`UPDATE units SET site_id = ${defaultSiteId} WHERE site_id IS NULL`;
      console.log("\u2705 Updated existing units with default site");
      await sql`ALTER TABLE "units" ALTER COLUMN "site_id" SET NOT NULL`;
      console.log("\u2705 Made units.site_id NOT NULL");
      try {
        await sql`
          ALTER TABLE "units" 
          ADD CONSTRAINT "units_site_id_sites_id_fk" 
          FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE cascade ON UPDATE no action
        `;
      } catch (e) {
        if (!e.message.includes("already exists")) throw e;
      }
      await sql`CREATE INDEX IF NOT EXISTS "units_site_id_idx" ON "units" USING btree ("site_id")`;
      console.log("\u2705 Added units-sites foreign key and index");
    } else {
      console.log("\u23ED\uFE0F  units.site_id already exists");
    }
    console.log("\n\u2705 Migration completed successfully!");
  } catch (error) {
    console.error("\u274C Migration failed:", error);
    process.exit(1);
  }
  await sql.end();
}
main();
