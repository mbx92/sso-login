import { defineEventHandler, createError } from "h3";
import { db, userAppAccess, users, oidcClients } from "../../../db/index.js";
import { eq, inArray } from "drizzle-orm";
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
var bulk_post_default = defineEventHandler(async (event) => {
  const body = await parseBody(event);
  const { userIds, clientId, expiresAt, notes } = body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "userIds must be a non-empty array"
    });
  }
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: "clientId is required"
    });
  }
  try {
    const [client] = await db.select().from(oidcClients).where(eq(oidcClients.id, clientId)).limit(1);
    if (!client) {
      throw createError({
        statusCode: 404,
        message: "Client/Application not found"
      });
    }
    const existingUsers = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
    if (existingUsers.length !== userIds.length) {
      throw createError({
        statusCode: 400,
        message: "Some user IDs are invalid"
      });
    }
    const sessionUser = getSessionUser(event);
    const existingAccess = await db.select({ userId: userAppAccess.userId }).from(userAppAccess).where(eq(userAppAccess.clientId, clientId));
    const existingUserIds = new Set(existingAccess.map((a) => a.userId));
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));
    const updateUserIds = userIds.filter((id) => existingUserIds.has(id));
    let insertedCount = 0;
    let updatedCount = 0;
    if (newUserIds.length > 0) {
      const insertValues = newUserIds.map((userId) => ({
        userId,
        clientId,
        grantedBy: sessionUser?.userId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        isActive: true
      }));
      await db.insert(userAppAccess).values(insertValues);
      insertedCount = newUserIds.length;
    }
    for (const userId of updateUserIds) {
      await db.update(userAppAccess).set({
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        grantedBy: sessionUser?.userId || null,
        grantedAt: /* @__PURE__ */ new Date()
      }).where(eq(userAppAccess.userId, userId));
      updatedCount++;
    }
    await writeAuditLog({
      action: "ADMIN_USER_ACCESS_BULK_GRANTED",
      actorUserId: sessionUser?.userId,
      targetType: "oidc_client",
      targetId: clientId,
      metadata: {
        clientName: client.name,
        userCount: userIds.length,
        insertedCount,
        updatedCount,
        expiresAt
      }
    });
    return {
      success: true,
      message: `Access granted to ${userIds.length} users for ${client.name}`,
      data: {
        total: userIds.length,
        inserted: insertedCount,
        updated: updatedCount
      }
    };
  } catch (error) {
    console.error("Failed to bulk grant user access:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to bulk grant user access"
    });
  }
});
export {
  bulk_post_default as default
};
