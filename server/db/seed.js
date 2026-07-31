import { db, users, roles, userRoles, sites } from "./index";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";
async function seedDatabase() {
  console.log("\u{1F331} Starting database seed...");
  const superadminEmail = process.env.SUPERADMIN_EMAIL || "admin@example.com";
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || "change-me";
  try {
    console.log("\u{1F3E2} Creating default site...");
    const existingSite = await db.select().from(sites).where(eq(sites.code, "HQ")).limit(1);
    if (existingSite.length === 0) {
      await db.insert(sites).values({
        code: "HQ",
        name: "Headquarters",
        description: "Default headquarters site",
        isActive: true
      });
      console.log("  \u2705 Created default site: Headquarters");
    } else {
      console.log("  \u23ED\uFE0F  Default site already exists: Headquarters");
    }
    const defaultRoles = [
      { name: "superadmin", description: "Full system access - can manage sites, clients, users, roles, and all settings" },
      { name: "admin", description: "Administrative access - can manage users and view audit logs" },
      { name: "user", description: "Regular user - basic SSO access" }
    ];
    console.log("\u{1F4CB} Creating default roles...");
    for (const role of defaultRoles) {
      const existing = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(roles).values(role);
        console.log(`  \u2705 Created role: ${role.name}`);
      } else {
        console.log(`  \u23ED\uFE0F  Role already exists: ${role.name}`);
      }
    }
    console.log("\u{1F464} Creating superadmin user...");
    const existingUser = await db.select().from(users).where(eq(users.email, superadminEmail)).limit(1);
    if (existingUser.length === 0) {
      const passwordHash = await argon2.hash(superadminPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        // 64 MB
        timeCost: 3,
        parallelism: 4
      });
      const [newUser] = await db.insert(users).values({
        email: superadminEmail,
        name: "System Administrator",
        status: "active",
        passwordHash
      }).returning();
      const [superadminRole] = await db.select().from(roles).where(eq(roles.name, "superadmin")).limit(1);
      if (superadminRole) {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: superadminRole.id
        });
      }
      console.log(`  \u2705 Created superadmin user: ${superadminEmail}`);
    } else {
      console.log(`  \u23ED\uFE0F  Superadmin user already exists: ${superadminEmail}`);
    }
    console.log("\u{1F331} Database seed completed!");
  } catch (error) {
    console.error("\u274C Seed failed:", error);
    throw error;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
export {
  seedDatabase
};
