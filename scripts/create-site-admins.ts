/**
 * Script untuk membuat user admin untuk setiap site
 * 
 * Usage:
 *   npx tsx scripts/create-site-admins.ts
 * 
 * Script ini akan:
 * 1. Mengambil semua site dari database
 * 2. Membuat role "Site Admin" untuk setiap site (jika belum ada)
 * 3. Membuat user admin untuk setiap site
 */

import { db, sites, users, roles, userRoles, PERMISSIONS } from '../server/db/index'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'

// Default password untuk admin baru (WAJIB diganti setelah login pertama)
const DEFAULT_PASSWORD = 'Admin@123'

// Permissions untuk Site Admin - TIDAK termasuk Sites (hanya superadmin)
const SITE_ADMIN_PERMISSIONS = Object.values(PERMISSIONS).filter(perm => 
  !perm.startsWith('sites.')  // Exclude sites permissions
)

async function createSiteAdmins() {
  console.log('🚀 Memulai pembuatan admin per site...\n')

  try {
    // 1. Ambil semua site
    const allSites = await db.select().from(sites).where(eq(sites.isActive, true))
    
    if (allSites.length === 0) {
      console.log('❌ Tidak ada site aktif. Buat site terlebih dahulu.')
      return
    }

    console.log(`📋 Ditemukan ${allSites.length} site aktif:\n`)

    // Hash password
    const passwordHash = await argon2.hash(DEFAULT_PASSWORD, { type: argon2.argon2id })

    for (const site of allSites) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`🏢 Site: ${site.name} (${site.code})`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

      // 2. Buat atau cari role Site Admin untuk site ini
      const roleName = `Site Admin - ${site.code}`
      let siteRole = await db.select().from(roles).where(eq(roles.name, roleName)).then(r => r[0])

      if (!siteRole) {
        console.log(`   📝 Membuat role: ${roleName}`)
        const [newRole] = await db.insert(roles).values({
          name: roleName,
          description: `Administrator untuk site ${site.name}`,
          permissions: SITE_ADMIN_PERMISSIONS,
          siteId: site.id,
          isSystem: false
        }).returning()
        siteRole = newRole
        console.log(`   ✅ Role dibuat: ${siteRole.id}`)
      } else {
        console.log(`   ℹ️  Role sudah ada: ${roleName}`)
      }

      // 3. Buat user admin untuk site ini
      const adminEmail = `admin.${site.code.toLowerCase()}@sso.local`
      const adminName = `Admin ${site.name}`
      
      let adminUser = await db.select().from(users).where(eq(users.email, adminEmail)).then(u => u[0])

      if (!adminUser) {
        console.log(`   📝 Membuat user: ${adminEmail}`)
        const [newUser] = await db.insert(users).values({
          email: adminEmail,
          name: adminName,
          passwordHash: passwordHash,
          status: 'active',
          roleId: 'admin',
          roleName: roleName,
          department: 'IT',
          position: 'Site Administrator'
        }).returning()
        adminUser = newUser
        console.log(`   ✅ User dibuat: ${adminUser.id}`)

        // 4. Assign role ke user
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: siteRole.id
        }).onConflictDoNothing()
        console.log(`   ✅ Role assigned ke user`)
      } else {
        console.log(`   ℹ️  User sudah ada: ${adminEmail}`)
        
        // Update role jika perlu
        await db.update(users).set({
          roleId: 'admin',
          roleName: roleName
        }).where(eq(users.id, adminUser.id))
        
        // Pastikan role sudah di-assign
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: siteRole.id
        }).onConflictDoNothing()
      }

      console.log(`\n   📧 Email: ${adminEmail}`)
      console.log(`   🔑 Password: ${DEFAULT_PASSWORD}`)
    }

    // Buat juga superadmin global jika belum ada
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🌐 Superadmin Global`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    const superadminEmail = 'superadmin@sso.local'
    let superadmin = await db.select().from(users).where(eq(users.email, superadminEmail)).then(u => u[0])

    if (!superadmin) {
      console.log(`   📝 Membuat superadmin...`)
      const [newSuperadmin] = await db.insert(users).values({
        email: superadminEmail,
        name: 'Super Administrator',
        passwordHash: passwordHash,
        status: 'active',
        roleId: 'superadmin',
        roleName: 'Super Administrator',
        department: 'IT',
        position: 'Super Administrator'
      }).returning()
      superadmin = newSuperadmin
      console.log(`   ✅ Superadmin dibuat`)
    } else {
      console.log(`   ℹ️  Superadmin sudah ada`)
    }

    console.log(`\n   📧 Email: ${superadminEmail}`)
    console.log(`   🔑 Password: ${DEFAULT_PASSWORD}`)

    console.log(`\n\n✅ Selesai!`)
    console.log(`\n⚠️  PENTING: Segera ganti password default setelah login!`)
    console.log(`   Password default: ${DEFAULT_PASSWORD}\n`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Run
createSiteAdmins()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
