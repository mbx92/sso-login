import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients } = schema

async function checkClient() {
  const [client] = await db
    .select()
    .from(oidcClients)
    .where(eq(oidcClients.clientId, 'sso_dd8bd281c72542638eb52e2e'))
    .limit(1)

  if (client) {
    console.log('Client Name:', client.name)
    console.log('Client ID:', client.clientId)
    console.log('Token Endpoint Auth Method:', client.tokenEndpointAuthMethod)
    console.log('Has Client Secret:', !!client.clientSecretHash)
    console.log('\nRegistered Redirect URIs:')
    console.log(JSON.stringify(client.redirectUris, null, 2))
  } else {
    console.log('Client not found!')
  }

  await queryClient.end()
  process.exit(0)
}

checkClient()
