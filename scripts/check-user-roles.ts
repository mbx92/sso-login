import 'dotenv/config'
import { db, users, userRoles, roles } from '../server/db/index'
import { eq } from 'drizzle-orm'

/**
 * Check if users have roles assigned
 */
async function checkUserRoles() {
  console.log('🔍 Checking user roles...\n')

  try {
    // Get all users
    const allUsers = await db.select().from(users)

    console.log(`Found ${allUsers.length} users:\n`)

    for (const user of allUsers) {
      console.log(`📧 User: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Legacy roleId: ${user.roleId || 'none'}`)
      console.log(`   Legacy roleName: ${user.roleName || 'none'}`)

      // Get roles from userRoles table
      const userRolesData = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
          roleDescription: roles.description
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, user.id))

      if (userRolesData.length > 0) {
        console.log(`   ✅ Roles (from userRoles table):`)
        userRolesData.forEach(role => {
          console.log(`      - ${role.roleName} (${role.roleDescription})`)
        })
      } else {
        console.log(`   ❌ NO ROLES ASSIGNED in userRoles table!`)
      }

      console.log()
    }

    // Summary
    const usersWithoutRoles = []
    for (const user of allUsers) {
      const rolesCount = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, user.id))

      if (rolesCount.length === 0) {
        usersWithoutRoles.push(user.email)
      }
    }

    console.log('═'.repeat(60))
    console.log('📊 SUMMARY:')
    console.log('═'.repeat(60))
    console.log(`Total users: ${allUsers.length}`)
    console.log(`Users without roles: ${usersWithoutRoles.length}`)

    if (usersWithoutRoles.length > 0) {
      console.log('\n❌ Users without roles:')
      usersWithoutRoles.forEach(email => console.log(`   - ${email}`))
      console.log('\n💡 Tip: Run the seeder or assign roles manually')
    } else {
      console.log('✅ All users have roles assigned')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Run check
checkUserRoles()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
