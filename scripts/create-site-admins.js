import { db, sites, users, roles, userRoles, PERMISSIONS } from "../server/db/index";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";
const DEFAULT_PASSWORD = "Admin@123";
const SITE_ADMIN_PERMISSIONS = Object.values(PERMISSIONS).filter(
  (perm) => !perm.startsWith("sites.")
  // Exclude sites permissions
);
async function createSiteAdmins() {
  console.log("\u{1F680} Memulai pembuatan admin per site...\n");
  try {
    const allSites = await db.select().from(sites).where(eq(sites.isActive, true));
    if (allSites.length === 0) {
      console.log("\u274C Tidak ada site aktif. Buat site terlebih dahulu.");
      return;
    }
    console.log(`\u{1F4CB} Ditemukan ${allSites.length} site aktif:
`);
    const passwordHash = await argon2.hash(DEFAULT_PASSWORD, { type: argon2.argon2id });
    for (const site of allSites) {
      console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
      console.log(`\u{1F3E2} Site: ${site.name} (${site.code})`);
      console.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
      const roleName = `Site Admin - ${site.code}`;
      let siteRole = await db.select().from(roles).where(eq(roles.name, roleName)).then((r) => r[0]);
      if (!siteRole) {
        console.log(`   \u{1F4DD} Membuat role: ${roleName}`);
        const [newRole] = await db.insert(roles).values({
          name: roleName,
          description: `Administrator untuk site ${site.name}`,
          permissions: SITE_ADMIN_PERMISSIONS,
          siteId: site.id,
          isSystem: false
        }).returning();
        siteRole = newRole;
        console.log(`   \u2705 Role dibuat: ${siteRole.id}`);
      } else {
        console.log(`   \u2139\uFE0F  Role sudah ada: ${roleName}`);
      }
      const adminEmail = `admin.${site.code.toLowerCase()}@sso.local`;
      const adminName = `Admin ${site.name}`;
      let adminUser = await db.select().from(users).where(eq(users.email, adminEmail)).then((u) => u[0]);
      if (!adminUser) {
        console.log(`   \u{1F4DD} Membuat user: ${adminEmail}`);
        const [newUser] = await db.insert(users).values({
          email: adminEmail,
          name: adminName,
          passwordHash,
          status: "active",
          roleId: "admin",
          roleName,
          department: "IT",
          position: "Site Administrator"
        }).returning();
        adminUser = newUser;
        console.log(`   \u2705 User dibuat: ${adminUser.id}`);
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: siteRole.id
        }).onConflictDoNothing();
        console.log(`   \u2705 Role assigned ke user`);
      } else {
        console.log(`   \u2139\uFE0F  User sudah ada: ${adminEmail}`);
        await db.update(users).set({
          roleId: "admin",
          roleName
        }).where(eq(users.id, adminUser.id));
        await db.insert(userRoles).values({
          userId: adminUser.id,
          roleId: siteRole.id
        }).onConflictDoNothing();
      }
      console.log(`
   \u{1F4E7} Email: ${adminEmail}`);
      console.log(`   \u{1F511} Password: ${DEFAULT_PASSWORD}`);
    }
    console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
    console.log(`\u{1F310} Superadmin Global`);
    console.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
    const superadminEmail = "superadmin@sso.local";
    let superadmin = await db.select().from(users).where(eq(users.email, superadminEmail)).then((u) => u[0]);
    if (!superadmin) {
      console.log(`   \u{1F4DD} Membuat superadmin...`);
      const [newSuperadmin] = await db.insert(users).values({
        email: superadminEmail,
        name: "Super Administrator",
        passwordHash,
        status: "active",
        roleId: "superadmin",
        roleName: "Super Administrator",
        department: "IT",
        position: "Super Administrator"
      }).returning();
      superadmin = newSuperadmin;
      console.log(`   \u2705 Superadmin dibuat`);
    } else {
      console.log(`   \u2139\uFE0F  Superadmin sudah ada`);
    }
    console.log(`
   \u{1F4E7} Email: ${superadminEmail}`);
    console.log(`   \u{1F511} Password: ${DEFAULT_PASSWORD}`);
    console.log(`

\u2705 Selesai!`);
    console.log(`
\u26A0\uFE0F  PENTING: Segera ganti password default setelah login!`);
    console.log(`   Password default: ${DEFAULT_PASSWORD}
`);
  } catch (error) {
    console.error("\u274C Error:", error);
    throw error;
  }
}
createSiteAdmins().then(() => process.exit(0)).catch(() => process.exit(1));
