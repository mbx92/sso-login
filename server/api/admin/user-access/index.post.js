import { defineEventHandler, createError } from "h3";
import { db, userAppAccess, users, oidcClients } from "../../../db/index.js";
import { eq } from "drizzle-orm";
import { writeAuditLog } from "../../../services/audit.js";
async function parseBody(event) {
  const req = event.node?.req || event.req;
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
function getSessionUser(event) {
  const cookies = event.node?.req?.headers?.cookie || "";
  const userCookie = cookies.split(";").find((c) => c.trim().startsWith("sso_user="));
  if (!userCookie) return null;
  try {
    const userDataStr = decodeURIComponent(userCookie.split("=")[1]);
    return JSON.parse(userDataStr);
  } catch {
    return null;
  }
}
var index_post_default = defineEventHandler(async (event) => {
  const body = await parseBody(event);
  const { userId, clientId, expiresAt, notes } = body;
  if (!userId || !clientId) {
    throw createError({
      statusCode: 400,
      message: "userId and clientId are required"
    });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found"
      });
    }
    const [client] = await db.select().from(oidcClients).where(eq(oidcClients.id, clientId)).limit(1);
    if (!client) {
      throw createError({
        statusCode: 404,
        message: "Client/Application not found"
      });
    }
    const sessionUser = getSessionUser(event);
    const [existingAccess] = await db.select().from(userAppAccess).where(
      eq(userAppAccess.userId, userId)
    ).limit(1);
    let result;
    if (existingAccess && existingAccess.clientId === clientId) {
      ;
      [result] = await db.update(userAppAccess).set({
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        grantedBy: sessionUser?.userId || null,
        grantedAt: /* @__PURE__ */ new Date()
      }).where(eq(userAppAccess.id, existingAccess.id)).returning();
    } else {
      ;
      [result] = await db.insert(userAppAccess).values({
        userId,
        clientId,
        grantedBy: sessionUser?.userId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        isActive: true
      }).returning();
    }
    await writeAuditLog({
      action: "ADMIN_USER_ACCESS_GRANTED",
      actorUserId: sessionUser?.userId,
      targetType: "user_app_access",
      targetId: result.id,
      metadata: {
        userId,
        userName: user.name,
        clientId,
        clientName: client.name,
        expiresAt
      }
    });
    return {
      success: true,
      message: `Access granted to ${user.name} for ${client.name}`,
      data: result
    };
  } catch (error) {
    console.error("Failed to grant user access:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to grant user access"
    });
  }
});
export {
  index_post_default as default
};
