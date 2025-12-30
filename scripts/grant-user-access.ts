import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { eq, like, ilike } from 'drizzle-orm'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { oidcClients, users, userAppAccess } = schema

async function grantUserAccess() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/grant-user-access.ts <user_email_or_id> <client_id_or_name>')
    console.log('')
    console.log('Examples:')
    console.log('  npx tsx scripts/grant-user-access.ts john@example.com netman')
    console.log('  npx tsx scripts/grant-user-access.ts 550e8400-e29b-41d4-a716-446655440000 sso_dd8bd281c72542638eb52e2e')
    await queryClient.end()
    process.exit(1)
  }

  const userIdentifier = args[0]
  const clientIdentifier = args[1]

  try {
    // Find user by email or ID
    let user
    if (userIdentifier.includes('@')) {
      ;[user] = await db
        .select()
        .from(users)
        .where(eq(users.email, userIdentifier))
        .limit(1)
    } else {
      ;[user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdentifier))
        .limit(1)
    }

    if (!user) {
      console.error('❌ User not found:', userIdentifier)
      await queryClient.end()
      process.exit(1)
    }

    // Find client by clientId or name
    let client
    ;[client] = await db
      .select()
      .from(oidcClients)
      .where(eq(oidcClients.clientId, clientIdentifier))
      .limit(1)

    if (!client) {
      ;[client] = await db
        .select()
        .from(oidcClients)
        .where(ilike(oidcClients.name, `%${clientIdentifier}%`))
        .limit(1)
    }

    if (!client) {
      console.error('❌ Client not found:', clientIdentifier)
      await queryClient.end()
      process.exit(1)
    }

    // Check if access already exists
    const [existingAccess] = await db
      .select()
      .from(userAppAccess)
      .where(eq(userAppAccess.userId, user.id))
      .limit(1)

    if (existingAccess && existingAccess.clientId === client.id) {
      // Update existing
      await db
        .update(userAppAccess)
        .set({
          isActive: true,
          grantedAt: new Date()
        })
        .where(eq(userAppAccess.id, existingAccess.id))
      console.log('✅ Access updated (re-activated)')
    } else {
      // Create new
      await db
        .insert(userAppAccess)
        .values({
          userId: user.id,
          clientId: client.id,
          isActive: true
        })
      console.log('✅ Access granted!')
    }

    console.log('═══════════════════════════════════════════')
    console.log('User:', user.name, `(${user.email})`)
    console.log('App:', client.name)
    console.log('═══════════════════════════════════════════')

  } catch (error) {
    console.error('Error:', error)
  }

  await queryClient.end()
  process.exit(0)
}

grantUserAccess()
