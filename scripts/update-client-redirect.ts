import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients } = schema

async function updateClient() {
  const clientId = 'sso_dd8bd281c72542638eb52e2e'
  
  // Update redirect URIs to include both localhost and IP
  const redirectUris = [
    'http://192.168.1.104:3001/auth/callback',
    'http://localhost:3001/auth/callback'
  ]

  await db
    .update(oidcClients)
    .set({
      redirectUris,
      updatedAt: new Date()
    })
    .where(eq(oidcClients.clientId, clientId))

  console.log('✅ Client updated successfully!')
  console.log('Redirect URIs now include:')
  console.log(JSON.stringify(redirectUris, null, 2))

  await queryClient.end()
  process.exit(0)
}

updateClient()
