import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const connectionString = process.env.DATABASE_URL || 'postgres://mbx:nopassword123!@10.100.10.5:5432/sso_db'

const sql = postgres(connectionString)

async function main() {
  console.log('Applying migration 0001_cloudy_sersi.sql...')
  
  try {
    const migrationPath = join(process.cwd(), 'server/db/migrations/0001_cloudy_sersi.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`)
      await sql.unsafe(statement)
    }
    
    console.log('\n✅ Migration 0001 completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
  
  await sql.end()
}

main()
