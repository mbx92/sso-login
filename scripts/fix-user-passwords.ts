import 'dotenv/config'
import { db, users } from '../server/db/index'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import * as readline from 'readline'

/**
 * Fix user passwords by re-hashing with argon2
 * This is needed if passwords were previously hashed with bcrypt
 */
async function fixUserPasswords() {
  console.log('🔐 Fix User Passwords')
  console.log('═'.repeat(60))
  console.log('This script will reset passwords for users.')
  console.log('You can either reset a specific user or reset the superadmin.')
  console.log('═'.repeat(60))
  console.log()

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve))
  }

  try {
    // Get all users
    const allUsers = await db.select().from(users)
    
    console.log('📋 Users in database:')
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - ${user.name}`)
    })
    console.log()

    const email = await question('Enter user email to reset password (or press Enter for admin@example.com): ')
    const targetEmail = email.trim() || 'admin@example.com'

    const newPassword = await question('Enter new password (min 8 chars): ')
    
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters')
      rl.close()
      process.exit(1)
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail.toLowerCase()))
      .limit(1)

    if (!user) {
      console.error(`❌ User not found: ${targetEmail}`)
      rl.close()
      process.exit(1)
    }

    console.log()
    console.log(`🔄 Resetting password for: ${user.email}`)

    // Hash password using argon2id (same as seed.ts and login.post.ts)
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4
    })

    // Update user password
    await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))

    console.log('✅ Password updated successfully!')
    console.log()
    console.log(`📧 Email: ${user.email}`)
    console.log(`🔑 New password: ${newPassword}`)
    console.log()
    console.log('You can now login with the new password.')

    rl.close()
  } catch (error) {
    console.error('❌ Error:', error)
    rl.close()
    throw error
  }
}

// Run fix
fixUserPasswords()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
