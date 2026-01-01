/**
 * Script untuk test password verification
 */
import * as argon2 from 'argon2'
import { db, users } from '../server/db/index'
import { eq } from 'drizzle-orm'

const testEmail = process.argv[2] || 'admin.rsia@sso.local'
const testPassword = process.argv[3] || 'Admin@123'

async function testLogin() {
  console.log(`Testing login for: ${testEmail}`)
  console.log(`Password: ${testPassword}`)
  
  try {
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        status: users.status
      })
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1)
    
    if (userResult.length === 0) {
      console.log('❌ User not found!')
      return
    }
    
    const user = userResult[0]
    console.log('\nUser found:')
    console.log('  ID:', user.id)
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  Status:', user.status)
    console.log('  Password Hash:', user.passwordHash ? 'EXISTS' : 'NULL')
    
    if (!user.passwordHash) {
      console.log('\n❌ Password hash is NULL!')
      return
    }
    
    console.log('\nVerifying password...')
    const isValid = await argon2.verify(user.passwordHash, testPassword)
    
    if (isValid) {
      console.log('✅ Password is VALID!')
    } else {
      console.log('❌ Password is INVALID!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

testLogin()
