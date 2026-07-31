import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema.js";
import { isNull } from "drizzle-orm";
import * as argon2 from "argon2";
import "dotenv/config";
const queryClient = postgres(process.env.DATABASE_URL || "postgres://localhost:5432/sso_db");
const db = drizzle(queryClient, { schema });
const { users } = schema;
async function setHrisPasswords() {
  const defaultPassword = process.env.HRIS_DEFAULT_PASSWORD || "Welcome123!";
  console.log("\u{1F50D} Finding users without passwords...");
  const usersWithoutPassword = await db.select().from(users).where(isNull(users.passwordHash));
  console.log(`\u{1F4CA} Found ${usersWithoutPassword.length} users without passwords`);
  if (usersWithoutPassword.length === 0) {
    console.log("\u2705 All users already have passwords!");
    return;
  }
  console.log(`\u{1F510} Setting default password: "${defaultPassword}"`);
  console.log("\u23F3 Hashing passwords...");
  const passwordHash = await argon2.hash(defaultPassword);
  let updated = 0;
  for (const user of usersWithoutPassword) {
    try {
      await db.update(users).set({
        passwordHash,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(isNull(users.passwordHash));
      updated++;
      if (updated % 100 === 0) {
        console.log(`  \u2713 Updated ${updated}/${usersWithoutPassword.length} users...`);
      }
    } catch (error) {
      console.error(`  \u2717 Failed to update user ${user.email}:`, error.message);
    }
  }
  console.log(`
\u2705 Successfully updated ${updated} users!`);
  console.log(`
\u{1F4DD} Users can now login with:`);
  console.log(`   Email: [their HRIS email]`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`
\u26A0\uFE0F  REMINDER: Implement password reset flow for production!`);
}
setHrisPasswords().then(async () => {
  console.log("\n\u{1F389} Done!");
  await queryClient.end();
  process.exit(0);
}).catch(async (error) => {
  console.error("\n\u274C Error:", error);
  await queryClient.end();
  process.exit(1);
});
