import { db, oidcKv } from "../../../db/index";
import { eq } from "drizzle-orm";
import { writeAuditLog } from "../../../services/audit";
function parseBody(event) {
  return new Promise((resolve) => {
    const chunks = [];
    event.node.req.on("data", (chunk) => chunks.push(chunk));
    event.node.req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        resolve(body);
      } catch {
        resolve(null);
      }
    });
    event.node.req.on("error", () => resolve(null));
  });
}
var id_delete_default = defineEventHandler(async (event) => {
  try {
    const sessionId = event.context.params?.id;
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: "Session ID is required"
      });
    }
    const [entry] = await db.select().from(oidcKv).where(eq(oidcKv.id, sessionId)).limit(1);
    if (!entry) {
      throw createError({
        statusCode: 404,
        message: "Session not found"
      });
    }
    const payload = entry.payload;
    const userId = payload?.userId || payload?.accountId;
    const clientId = payload?.clientId;
    await db.delete(oidcKv).where(eq(oidcKv.id, sessionId));
    if (entry.grantId) {
      await db.delete(oidcKv).where(eq(oidcKv.grantId, entry.grantId));
    }
    if (userId && clientId) {
      const allUserTokens = await db.select().from(oidcKv).where(eq(oidcKv.model, "RefreshToken"));
      for (const token of allUserTokens) {
        const tokenPayload = token.payload;
        if ((tokenPayload?.userId === userId || tokenPayload?.accountId === userId) && tokenPayload?.clientId === clientId) {
          await db.delete(oidcKv).where(eq(oidcKv.id, token.id));
        }
      }
    }
    console.log(`Revoked all sessions for user ${userId} on client ${clientId}`);
    const forwardedFor = event.node?.req.headers["x-forwarded-for"];
    const clientIp = (typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : null) || event.node?.req.socket.remoteAddress || "unknown";
    const userCookie = event.node.req.headers.cookie?.split(";").find((c) => c.trim().startsWith("sso_user="))?.split("=")[1];
    let adminUserId = null;
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        adminUserId = userData.userId;
      } catch {
      }
    }
    await writeAuditLog({
      action: "SESSION_REVOKED",
      actorUserId: adminUserId,
      actorType: "user",
      targetType: "session",
      targetId: userId,
      ip: clientIp,
      userAgent: event.node?.req.headers["user-agent"] || "unknown",
      metadata: {
        sessionId,
        revokedUserId: userId,
        clientId
      }
    });
    return {
      success: true,
      message: "Session revoked successfully"
    };
  } catch (error) {
    console.error("Error revoking session:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Failed to revoke session"
    });
  }
});
export {
  id_delete_default as default
};
