import 'dotenv/config'
import { db, users, roles, userRoles, sites } from './index'
import { eq, and } from 'drizzle-orm'
import * as argon2 from 'argon2'

/**
 * Seed the database with initial data:
 * - Default site (Headquarters)
 * - Default roles (superadmin, admin, user)
 * - Superadmin user from environment variables
 */
export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seed...')

  // Get superadmin credentials from environment
  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@example.com'
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'change-me'

  try {
    // Create default site
    console.log('🏢 Creating default site...')
    const existingSite = await db.select().from(sites).where(eq(sites.code, 'HQ')).limit(1)
    if (existingSite.length === 0) {
      await db.insert(sites).values({
        code: 'HQ',
        name: 'Headquarters',
        description: 'Default headquarters site',
        isActive: true
      })
      console.log('  ✅ Created default site: Headquarters')
    } else {
      console.log('  ⏭️  Default site already exists: Headquarters')
    }

    // Create default roles
    const defaultRoles = [
      { name: 'superadmin', description: 'Full system access - can manage sites, clients, users, roles, and all settings' },
      { name: 'admin', description: 'Administrative access - can manage users and view audit logs' },
      { name: 'user', description: 'Regular user - basic SSO access' }
    ]

    console.log('📋 Creating default roles...')
    for (const role of defaultRoles) {
      const existing = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1)
      if (existing.length === 0) {
        await db.insert(roles).values(role)
        console.log(`  ✅ Created role: ${role.name}`)
      } else {
        console.log(`  ⏭️  Role already exists: ${role.name}`)
      }
    }

    // Create superadmin user
    console.log('👤 Checking superadmin user...')
    let userId: string

    const existingUser = await db.select().from(users).where(eq(users.email, superadminEmail)).limit(1)
    
    if (existingUser.length === 0) {
      console.log('👤 Creating superadmin user...')
      // Hash password using argon2id
      const passwordHash = await argon2.hash(superadminPassword, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4
      })

      // Insert superadmin user
      const [newUser] = await db.insert(users).values({
        email: superadminEmail,
        name: 'System Administrator',
        status: 'active',
        passwordHash
      }).returning()
      userId = newUser.id
      console.log(`  ✅ Created superadmin user: ${superadminEmail}`)
    } else {
      console.log(`  ⏭️  Superadmin user already exists: ${superadminEmail}`)
      userId = existingUser[0].id
    }

    // Always ensure superadmin has the superadmin role
    const [superadminRole] = await db.select().from(roles).where(eq(roles.name, 'superadmin')).limit(1)
    
    if (superadminRole) {
      // Check if already has role
      const [hasRole] = await db.select()
        .from(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, superadminRole.id)
        ))
        .limit(1)

      if (!hasRole) {
        await db.insert(userRoles).values({
          userId: userId,
          roleId: superadminRole.id
        })
        console.log('  ✅ Assigned superadmin role to user')
      } else {
        console.log('  ⏭️  User already has superadmin role')
      }
    }

    console.log('🌱 Database seed completed!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run seed if executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })

