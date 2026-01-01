/**
 * Script untuk update permissions Site Admin
 * Menghapus akses sites dari role Site Admin
 * 
 * Usage:
 *   npx tsx scripts/update-site-admin-permissions.ts
 */

import { db, roles, PERMISSIONS } from '../server/db/index'
import { like, eq } from 'drizzle-orm'

// Permissions untuk Site Admin - TIDAK termasuk Sites (hanya superadmin)
const SITE_ADMIN_PERMISSIONS = Object.values(PERMISSIONS).filter(perm => 
  !perm.startsWith('sites.')  // Exclude sites permissions
)

async function updateSiteAdminPermissions() {
  console.log('🔄 Updating Site Admin permissions...\n')

  try {
    // Find all Site Admin roles
    const siteAdminRoles = await db
      .select()
      .from(roles)
      .where(like(roles.name, 'Site Admin%'))
    
    console.log(`📋 Found ${siteAdminRoles.length} Site Admin roles\n`)

    for (const role of siteAdminRoles) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`🔧 Role: ${role.name}`)
      
      const oldPermissions = role.permissions || []
      console.log(`   Old permissions count: ${oldPermissions.length}`)
      
      // Update permissions - remove sites.*
      await db.update(roles)
        .set({ 
          permissions: SITE_ADMIN_PERMISSIONS,
          updatedAt: new Date()
        })
        .where(eq(roles.id, role.id))
      
      console.log(`   New permissions count: ${SITE_ADMIN_PERMISSIONS.length}`)
      console.log(`   ✅ Updated!`)
    }

    console.log('\n\n📋 Permissions yang DIHAPUS dari Site Admin:')
    console.log('   - sites.view')
    console.log('   - sites.create')
    console.log('   - sites.edit')
    console.log('   - sites.delete')
    
    console.log('\n✅ Selesai! Site Admin tidak lagi bisa mengakses menu Sites.\n')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Run
updateSiteAdminPermissions()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
