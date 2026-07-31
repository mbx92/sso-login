import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating __drizzle_migrations table and seeding already-applied migrations...')
  
  try {
    // Create the __drizzle_migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `
    console.log('✅ Created __drizzle_migrations table')
    
    // Define the migrations that are already applied (based on journal.json but skipping 0006)
    const appliedMigrations = [
      { hash: '0000_aberrant_violations', when: 1767077118001 },
      { hash: '0001_cloudy_sersi', when: 1767190635747 },
      { hash: '0002_mighty_jackpot', when: 1767191951460 },
      { hash: '0003_add_access_groups', when: 1767192000000 },
      { hash: '0004_add_last_activity', when: 1767192100000 },
      { hash: '0005_add_site_settings', when: 1767192200000 },
    ]
    
    for (const mig of appliedMigrations) {
      // Check if already exists
      const exists = await sql`
        SELECT 1 FROM __drizzle_migrations WHERE hash = ${mig.hash}
      `
      if (exists.length === 0) {
        await sql`
          INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${mig.hash}, ${mig.when})
        `
        console.log(`✅ Marked ${mig.hash} as applied`)
      } else {
        console.log(`⏭️  ${mig.hash} already marked as applied`)
      }
    }
    
    console.log('\n✅ Done! Now you can run: npm run db:migrate')
    console.log('   Only migration 0006_red_pete_wisdom.sql will be applied.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
  
  await sql.end()
}

main()
