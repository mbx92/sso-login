import { sql } from 'drizzle-orm'
import { db } from './index'

/**
 * Add last_activity_at column to users table
 */
async function migrate() {
  console.log('Running migration: Add last_activity_at column...')
  
  try {
    // Add the column
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP
    `)
    
    // Add index
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS users_last_activity_idx ON users(last_activity_at)
    `)
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
