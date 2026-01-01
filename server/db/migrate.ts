import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(connectionString, { max: 1 })
const db = drizzle(sql, { schema })

async function main() {
  console.log('Running migrations...')
  
  try {
    await migrate(db, { migrationsFolder: './server/db/migrations' })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
  
  await sql.end()
}

main()
