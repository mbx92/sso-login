import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients } = schema

async function updateClientToPublic() {
  const clientId = 'sso_dd8bd281c72542638eb52e2e'
  
  // Update to public client (no secret required, uses PKCE)
  await db
    .update(oidcClients)
    .set({
      tokenEndpointAuthMethod: 'none', // Public client
      clientSecretHash: null, // No secret needed
      updatedAt: new Date()
    })
    .where(eq(oidcClients.clientId, clientId))

  console.log('✅ Client updated to PUBLIC client!')
  console.log('Token Endpoint Auth Method: none')
  console.log('Client Secret: not required')
  console.log('\n⚠️  This client will use PKCE for security')

  await queryClient.end()
  process.exit(0)
}

updateClientToPublic()
