import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  try {
    // Mark 0006 as applied since all changes already exist in the database
    await sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('0006_red_pete_wisdom', 1768223151318)`
    console.log('✅ Migration 0006 marked as applied!')
    
    // Verify
    const migs = await sql`SELECT hash FROM __drizzle_migrations ORDER BY created_at`
    console.log('All migrations:', migs.map(m => m.hash).join(', '))
  } catch (error: any) {
    if (error.message?.includes('duplicate')) {
      console.log('✅ Migration 0006 already marked as applied')
    } else {
      console.error('Error:', error)
    }
  }
  await sql.end()
}

main()
