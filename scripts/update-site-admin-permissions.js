import { db, roles, PERMISSIONS } from "../server/db/index";
import { like, eq } from "drizzle-orm";
const SITE_ADMIN_PERMISSIONS = Object.values(PERMISSIONS).filter(
  (perm) => !perm.startsWith("sites.")
  // Exclude sites permissions
);
async function updateSiteAdminPermissions() {
  console.log("\u{1F504} Updating Site Admin permissions...\n");
  try {
    const siteAdminRoles = await db.select().from(roles).where(like(roles.name, "Site Admin%"));
    console.log(`\u{1F4CB} Found ${siteAdminRoles.length} Site Admin roles
`);
    for (const role of siteAdminRoles) {
      console.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
      console.log(`\u{1F527} Role: ${role.name}`);
      const oldPermissions = role.permissions || [];
      console.log(`   Old permissions count: ${oldPermissions.length}`);
      await db.update(roles).set({
        permissions: SITE_ADMIN_PERMISSIONS,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(roles.id, role.id));
      console.log(`   New permissions count: ${SITE_ADMIN_PERMISSIONS.length}`);
      console.log(`   \u2705 Updated!`);
    }
    console.log("\n\n\u{1F4CB} Permissions yang DIHAPUS dari Site Admin:");
    console.log("   - sites.view");
    console.log("   - sites.create");
    console.log("   - sites.edit");
    console.log("   - sites.delete");
    console.log("\n\u2705 Selesai! Site Admin tidak lagi bisa mengakses menu Sites.\n");
  } catch (error) {
    console.error("\u274C Error:", error);
    throw error;
  }
}
updateSiteAdminPermissions().then(() => process.exit(0)).catch(() => process.exit(1));
