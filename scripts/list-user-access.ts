import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients, users, userAppAccess } = schema

async function listUserAccess() {
  const args = process.argv.slice(2)
  const clientIdentifier = args[0]

  try {
    // Get all access grants with user and client info
    const grants = await db
      .select({
        id: userAppAccess.id,
        userId: userAppAccess.userId,
        userName: users.name,
        userEmail: users.email,
        userDepartment: users.department,
        clientId: userAppAccess.clientId,
        clientName: oidcClients.name,
        isActive: userAppAccess.isActive,
        grantedAt: userAppAccess.grantedAt,
        expiresAt: userAppAccess.expiresAt
      })
      .from(userAppAccess)
      .leftJoin(users, eq(userAppAccess.userId, users.id))
      .leftJoin(oidcClients, eq(userAppAccess.clientId, oidcClients.id))

    if (grants.length === 0) {
      console.log('No access grants found.')
      await queryClient.end()
      process.exit(0)
    }

    // Group by client
    const byClient = new Map<string, typeof grants>()
    for (const grant of grants) {
      const key = grant.clientName || 'Unknown'
      if (!byClient.has(key)) {
        byClient.set(key, [])
      }
      byClient.get(key)!.push(grant)
    }

    console.log('═══════════════════════════════════════════')
    console.log('USER ACCESS GRANTS')
    console.log('═══════════════════════════════════════════')

    for (const [clientName, clientGrants] of byClient) {
      console.log('')
      console.log(`📱 ${clientName}`)
      console.log('─'.repeat(40))
      
      for (const grant of clientGrants) {
        const status = grant.isActive ? '✅' : '❌'
        const expires = grant.expiresAt ? ` (expires: ${grant.expiresAt.toISOString().split('T')[0]})` : ''
        console.log(`  ${status} ${grant.userName} <${grant.userEmail}>${expires}`)
        if (grant.userDepartment) {
          console.log(`     └─ ${grant.userDepartment}`)
        }
      }
      
      console.log(`  Total: ${clientGrants.length} users`)
    }

    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log(`Total grants: ${grants.length}`)

  } catch (error) {
    console.error('Error:', error)
  }

  await queryClient.end()
  process.exit(0)
}

listUserAccess()
