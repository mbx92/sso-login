import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db'

console.log('Running migration 0003_add_access_groups.sql...')
console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'))

const sql = postgres(DATABASE_URL, { max: 1 })

try {
  // Read migration file
  const migrationPath = join(__dirname, 'migrations', '0003_add_access_groups.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')
  
  // Split by statement breakpoint
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  console.log(`Found ${statements.length} statements to execute`)
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement && statement.length > 0) {
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      await sql.unsafe(statement)
    }
  }
  
  console.log('✅ Migration completed successfully!')
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  await sql.end()
}
