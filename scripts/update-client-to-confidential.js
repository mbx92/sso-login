import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema.js";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";
import "dotenv/config";
const queryClient = postgres(process.env.DATABASE_URL || "postgres://localhost:5432/sso_db");
const db = drizzle(queryClient, { schema });
const { oidcClients } = schema;
async function updateClientToConfidential() {
  const clientId = "sso_dd8bd281c72542638eb52e2e";
  const clientSecret = "secret_netman_2024!";
  const clientSecretHash = await argon2.hash(clientSecret);
  await db.update(oidcClients).set({
    tokenEndpointAuthMethod: "client_secret_post",
    // Accept secret in POST body or Basic Auth
    clientSecretHash,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(oidcClients.clientId, clientId));
  console.log("\u2705 Client updated to CONFIDENTIAL client!");
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log("Client ID:", clientId);
  console.log("Client Secret:", clientSecret);
  console.log("Token Endpoint Auth Method: client_secret_post");
  console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  console.log("");
  console.log("\u{1F4CB} Di client app, gunakan credentials ini:");
  console.log("");
  console.log("  clientId:", `"${clientId}"`);
  console.log("  clientSecret:", `"${clientSecret}"`);
  console.log("");
  console.log("\u{1F4CC} Client dapat mengirim secret via:");
  console.log("  1. POST body: client_id & client_secret");
  console.log("  2. Authorization header: Basic base64(client_id:client_secret)");
  await queryClient.end();
  process.exit(0);
}
updateClientToConfidential();
