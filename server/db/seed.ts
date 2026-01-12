import 'dotenv/config'
import { db, users, roles, userRoles, sites } from './index'
import { eq } from 'drizzle-orm'
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
    console.log('👤 Creating superadmin user...')
    const existingUser = await db.select().from(users).where(eq(users.email, superadminEmail)).limit(1)
    
    if (existingUser.length === 0) {
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

      // Assign superadmin role
      const [superadminRole] = await db.select().from(roles).where(eq(roles.name, 'superadmin')).limit(1)
      if (superadminRole) {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: superadminRole.id
        })
      }

      console.log(`  ✅ Created superadmin user: ${superadminEmail}`)
    } else {
      console.log(`  ⏭️  Superadmin user already exists: ${superadminEmail}`)
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

