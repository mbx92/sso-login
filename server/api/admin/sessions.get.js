import { db, oidcKv, users, oidcClients, auditLogs } from "../../db/index";
import { gte, desc, inArray, eq, and } from "drizzle-orm";
function parseQuery(event) {
  const url = event.node.req.url || "";
  const queryString = url.split("?")[1] || "";
  const params = {};
  if (queryString) {
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  return params;
}
var sessions_get_default = defineEventHandler(async (event) => {
  try {
    const query = parseQuery(event);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
    const now = /* @__PURE__ */ new Date();
    const allEntries = await db.select({
      id: oidcKv.id,
      model: oidcKv.model,
      key: oidcKv.key,
      payload: oidcKv.payload,
      expiresAt: oidcKv.expiresAt,
      grantId: oidcKv.grantId
    }).from(oidcKv).where(gte(oidcKv.expiresAt, now)).orderBy(desc(oidcKv.expiresAt)).limit(limit * 3);
    const sessions = allEntries.filter(
      (e) => e.model === "RefreshToken" || e.model === "Session" || e.model === "AccessToken" || e.model === "Grant"
    );
    const userIds = /* @__PURE__ */ new Set();
    const clientIds = /* @__PURE__ */ new Set();
    for (const session of sessions) {
      const payload = session.payload;
      if (payload?.userId) {
        userIds.add(payload.userId);
      }
      if (payload?.accountId) {
        userIds.add(payload.accountId);
      }
      if (payload?.clientId) {
        clientIds.add(payload.clientId);
      }
    }
    const userList = userIds.size > 0 ? await db.select({ id: users.id, name: users.name, email: users.email, lastActivityAt: users.lastActivityAt }).from(users).where(inArray(users.id, Array.from(userIds))) : [];
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1e3);
    const userMap = new Map(userList.map((u) => [u.id, u]));
    const clientList = clientIds.size > 0 ? await db.select({ clientId: oidcClients.clientId, name: oidcClients.name }).from(oidcClients).where(inArray(oidcClients.clientId, Array.from(clientIds))) : [];
    const clientMap = new Map(clientList.map((c) => [c.clientId, c]));
    const loginInfoMap = /* @__PURE__ */ new Map();
    if (userIds.size > 0) {
      const loginLogs = await db.select({
        userId: auditLogs.actorUserId,
        ip: auditLogs.ip,
        userAgent: auditLogs.userAgent,
        at: auditLogs.at,
        metadata: auditLogs.metadata
      }).from(auditLogs).where(
        and(
          inArray(auditLogs.actorUserId, Array.from(userIds)),
          eq(auditLogs.action, "AUTH_LOGIN_SUCCESS")
        )
      ).orderBy(desc(auditLogs.at)).limit(100);
      for (const log of loginLogs) {
        if (log.userId && !loginInfoMap.has(log.userId)) {
          loginInfoMap.set(log.userId, {
            ip: log.ip || "Unknown",
            userAgent: log.userAgent || "Unknown",
            loginAt: log.at
          });
        }
      }
    }
    const activeSessions = [];
    const seenUsers = /* @__PURE__ */ new Set();
    for (const session of sessions) {
      const payload = session.payload;
      const userId = payload?.userId || payload?.accountId;
      const clientId = payload?.clientId;
      if (!userId || !clientId) continue;
      const key = `${userId}-${clientId}`;
      if (seenUsers.has(key)) continue;
      seenUsers.add(key);
      const user = userMap.get(userId);
      const client = clientMap.get(clientId);
      const loginInfo = loginInfoMap.get(userId);
      activeSessions.push({
        id: session.id,
        userId: userId || "unknown",
        userName: user?.name || "Unknown User",
        userEmail: user?.email || "unknown@email.com",
        clientId: clientId || "unknown",
        clientName: client?.name || clientId || "Unknown App",
        ip: loginInfo?.ip || "Unknown",
        userAgent: loginInfo?.userAgent || "Unknown",
        loginAt: loginInfo?.loginAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: session.expiresAt?.toISOString() || null,
        isOnline: user?.lastActivityAt ? user.lastActivityAt > onlineThreshold : false,
        lastActivityAt: user?.lastActivityAt?.toISOString() || null
      });
    }
    return {
      data: activeSessions,
      total: activeSessions.length
    };
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch active sessions"
    });
  }
});
export {
  sessions_get_default as default
};
