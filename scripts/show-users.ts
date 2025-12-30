import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })

async function showSampleUsers() {
  const users = await db.query.users.findMany({ limit: 10 })
  
  console.log('Sample Users (for granting access):')
  console.log('═══════════════════════════════════════════')
  users.forEach(u => {
    console.log(`Email: ${u.email}`)
    console.log(`  Name: ${u.name}`)
    console.log(`  ID: ${u.id}`)
    console.log('')
  })

  await queryClient.end()
}

showSampleUsers()
