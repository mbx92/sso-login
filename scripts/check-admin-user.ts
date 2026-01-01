import { db, users } from '../server/db/index.ts'
import { eq } from 'drizzle-orm'

async function checkAdminUser() {
  try {
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'))
      .limit(1)
    
    if (!admin) {
      console.log('❌ User admin@example.com tidak ditemukan!')
    } else {
      console.log('✓ User admin@example.com:')
      console.log('  - ID:', admin.id)
      console.log('  - Name:', admin.name)
      console.log('  - Email:', admin.email)
      console.log('  - Role ID:', admin.roleId || '(null)')
      console.log('  - Role Name:', admin.roleName || '(null)')
      console.log('  - Unit ID:', admin.unitId || '(null)')
      console.log('  - Status:', admin.status)
      
      if (!admin.roleName || admin.roleName !== 'superadmin') {
        console.log('\n⚠️  User tidak memiliki role superadmin!')
        console.log('   Akan update user menjadi superadmin...')
        
        await db.update(users)
          .set({ 
            roleName: 'superadmin',
            roleId: 'superadmin' 
          })
          .where(eq(users.email, 'admin@example.com'))
        
        console.log('✓ User berhasil di-update menjadi superadmin!')
      } else {
        console.log('\n✓ User sudah memiliki role superadmin')
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    process.exit(0)
  }
}

checkAdminUser()
