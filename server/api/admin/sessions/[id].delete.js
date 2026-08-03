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

    // 1. Remove the exact entry the admin selected
    await db.delete(oidcKv).where(eq(oidcKv.id, sessionId));

    // 2. Remove everything sharing the same grant (AuthorizationCode, AccessToken, RefreshToken, etc.)
    if (entry.grantId) {
      await db.delete(oidcKv).where(eq(oidcKv.grantId, entry.grantId));
    }

    if (userId) {
      // 3. Remove ALL browser sessions of this user so `sso_session` cookies
      //    become invalid everywhere (portal + every OIDC client)
      const allSessions = await db.select().from(oidcKv).where(eq(oidcKv.model, "Session"));
      for (const s of allSessions) {
        const p = s.payload;
        if (p?.userId === userId || p?.accountId === userId) {
          await db.delete(oidcKv).where(eq(oidcKv.id, s.id));
        }
      }

      // 4. Remove all grants + tokens (AccessToken, RefreshToken, Grant,
      //    AuthorizationCode) for this user across clients
      const tokenModels = ["RefreshToken", "AccessToken", "Grant", "AuthorizationCode"];
      const allTokenRows = await db.select().from(oidcKv);
      const revokedGrantIds = new Set();
      for (const row of allTokenRows) {
        if (!tokenModels.includes(row.model)) continue;
        const p = row.payload;
        const rowUser = p?.userId || p?.accountId;
        if (rowUser === userId) {
          await db.delete(oidcKv).where(eq(oidcKv.id, row.id));
          if (row.grantId) revokedGrantIds.add(row.grantId);
        }
      }
      for (const grantId of revokedGrantIds) {
        await db.delete(oidcKv).where(eq(oidcKv.grantId, grantId));
      }
    }
    console.log(`Revoked all sessions and tokens for user ${userId}` + (clientId ? ` on client ${clientId}` : ""));
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
