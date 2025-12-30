import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients } = schema

async function enableAccessControl() {
  const clientId = 'sso_dd8bd281c72542638eb52e2e'
  
  // Enable access control for this client
  await db
    .update(oidcClients)
    .set({
      requireAccessGrant: true,
      updatedAt: new Date()
    })
    .where(eq(oidcClients.clientId, clientId))

  console.log('✅ Access control ENABLED for client!')
  console.log('═══════════════════════════════════════════')
  console.log('Client ID:', clientId)
  console.log('requireAccessGrant: true')
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('⚠️  Sekarang hanya user yang sudah di-grant access')
  console.log('   yang dapat mengakses aplikasi ini.')
  console.log('')
  console.log('📋 Gunakan API berikut untuk manage access:')
  console.log('   GET    /api/admin/user-access         - List semua access')
  console.log('   POST   /api/admin/user-access         - Grant access ke user')
  console.log('   DELETE /api/admin/user-access/:id     - Revoke access')
  console.log('   POST   /api/admin/user-access/bulk    - Bulk grant access')

  await queryClient.end()
  process.exit(0)
}

enableAccessControl()
