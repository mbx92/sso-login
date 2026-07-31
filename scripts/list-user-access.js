import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema.js";
import { eq } from "drizzle-orm";
import "dotenv/config";
const queryClient = postgres(process.env.DATABASE_URL || "postgres://localhost:5432/sso_db");
const db = drizzle(queryClient, { schema });
const { oidcClients, users, userAppAccess } = schema;
async function listUserAccess() {
  const args = process.argv.slice(2);
  const clientIdentifier = args[0];
  try {
    const grants = await db.select({
      id: userAppAccess.id,
      userId: userAppAccess.userId,
      userName: users.name,
      userEmail: users.email,
      userDepartment: users.department,
      clientId: userAppAccess.clientId,
      clientName: oidcClients.name,
      isActive: userAppAccess.isActive,
      grantedAt: userAppAccess.grantedAt,
      expiresAt: userAppAccess.expiresAt
    }).from(userAppAccess).leftJoin(users, eq(userAppAccess.userId, users.id)).leftJoin(oidcClients, eq(userAppAccess.clientId, oidcClients.id));
    if (grants.length === 0) {
      console.log("No access grants found.");
      await queryClient.end();
      process.exit(0);
    }
    const byClient = /* @__PURE__ */ new Map();
    for (const grant of grants) {
      const key = grant.clientName || "Unknown";
      if (!byClient.has(key)) {
        byClient.set(key, []);
      }
      byClient.get(key).push(grant);
    }
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    console.log("USER ACCESS GRANTS");
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    for (const [clientName, clientGrants] of byClient) {
      console.log("");
      console.log(`\u{1F4F1} ${clientName}`);
      console.log("\u2500".repeat(40));
      for (const grant of clientGrants) {
        const status = grant.isActive ? "\u2705" : "\u274C";
        const expires = grant.expiresAt ? ` (expires: ${grant.expiresAt.toISOString().split("T")[0]})` : "";
        console.log(`  ${status} ${grant.userName} <${grant.userEmail}>${expires}`);
        if (grant.userDepartment) {
          console.log(`     \u2514\u2500 ${grant.userDepartment}`);
        }
      }
      console.log(`  Total: ${clientGrants.length} users`);
    }
    console.log("");
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    console.log(`Total grants: ${grants.length}`);
  } catch (error) {
    console.error("Error:", error);
  }
  await queryClient.end();
  process.exit(0);
}
listUserAccess();
