import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients } = schema

async function updateClientToConfidential() {
  const clientId = 'sso_dd8bd281c72542638eb52e2e'
  const clientSecret = 'secret_netman_2024!' // Client secret yang akan digunakan
  
  // Hash the client secret
  const clientSecretHash = await argon2.hash(clientSecret)
  
  // Update to confidential client (requires client_secret)
  await db
    .update(oidcClients)
    .set({
      tokenEndpointAuthMethod: 'client_secret_post', // Accept secret in POST body or Basic Auth
      clientSecretHash: clientSecretHash,
      updatedAt: new Date()
    })
    .where(eq(oidcClients.clientId, clientId))

  console.log('✅ Client updated to CONFIDENTIAL client!')
  console.log('═══════════════════════════════════════════')
  console.log('Client ID:', clientId)
  console.log('Client Secret:', clientSecret)
  console.log('Token Endpoint Auth Method: client_secret_post')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('📋 Di client app, gunakan credentials ini:')
  console.log('')
  console.log('  clientId:', `"${clientId}"`)
  console.log('  clientSecret:', `"${clientSecret}"`)
  console.log('')
  console.log('📌 Client dapat mengirim secret via:')
  console.log('  1. POST body: client_id & client_secret')
  console.log('  2. Authorization header: Basic base64(client_id:client_secret)')

  await queryClient.end()
  process.exit(0)
}

updateClientToConfidential()
