/**
 * Script to set default password for existing HRIS users
 * Run with: npx tsx scripts/set-hris-passwords.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../server/db/schema.ts'
import { isNull } from 'drizzle-orm'
import * as argon2 from 'argon2'
import 'dotenv/config'

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db')
const db = drizzle(queryClient, { schema })
const { users } = schema

async function setHrisPasswords() {
  const defaultPassword = process.env.HRIS_DEFAULT_PASSWORD || 'Welcome123!'
  
  console.log('🔍 Finding users without passwords...')
  
  // Find all users with null passwordHash
  const usersWithoutPassword = await db
    .select()
    .from(users)
    .where(isNull(users.passwordHash))
  
  console.log(`📊 Found ${usersWithoutPassword.length} users without passwords`)
  
  if (usersWithoutPassword.length === 0) {
    console.log('✅ All users already have passwords!')
    return
  }
  
  console.log(`🔐 Setting default password: "${defaultPassword}"`)
  console.log('⏳ Hashing passwords...')
  
  const passwordHash = await argon2.hash(defaultPassword)
  
  let updated = 0
  for (const user of usersWithoutPassword) {
    try {
      await db
        .update(users)
        .set({ 
          passwordHash,
          updatedAt: new Date()
        })
        .where(isNull(users.passwordHash))
      
      updated++
      if (updated % 100 === 0) {
        console.log(`  ✓ Updated ${updated}/${usersWithoutPassword.length} users...`)
      }
    } catch (error: any) {
      console.error(`  ✗ Failed to update user ${user.email}:`, error.message)
    }
  }
  
  console.log(`\n✅ Successfully updated ${updated} users!`)
  console.log(`\n📝 Users can now login with:`)
  console.log(`   Email: [their HRIS email]`)
  console.log(`   Password: ${defaultPassword}`)
  console.log(`\n⚠️  REMINDER: Implement password reset flow for production!`)
}

setHrisPasswords()
  .then(async () => {
    console.log('\n🎉 Done!')
    await queryClient.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('\n❌ Error:', error)
    await queryClient.end()
    process.exit(1)
  })
