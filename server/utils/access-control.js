import { db, oidcClients, userAppAccess, accessGroupUsers, accessGroupClients } from "../db/index.js";
import { eq, and } from "drizzle-orm";
async function checkUserClientAccess(userId, clientId) {
  try {
    const [client] = await db.select({ requireAccessGrant: oidcClients.requireAccessGrant }).from(oidcClients).where(eq(oidcClients.id, clientId)).limit(1);
    if (!client || !client.requireAccessGrant) {
      return true;
    }
    const directAccess = await db.select({ id: userAppAccess.id }).from(userAppAccess).where(
      and(
        eq(userAppAccess.userId, userId),
        eq(userAppAccess.clientId, clientId),
        eq(userAppAccess.isActive, true)
      )
    ).limit(1);
    if (directAccess.length > 0) {
      return true;
    }
    const userGroups = await db.select({ groupId: accessGroupUsers.groupId }).from(accessGroupUsers).where(eq(accessGroupUsers.userId, userId));
    if (userGroups.length === 0) {
      return false;
    }
    const groupIds = userGroups.map((g) => g.groupId);
    for (const groupId of groupIds) {
      const groupClientAccess = await db.select({ id: accessGroupClients.id }).from(accessGroupClients).where(
        and(
          eq(accessGroupClients.groupId, groupId),
          eq(accessGroupClients.clientId, clientId)
        )
      ).limit(1);
      if (groupClientAccess.length > 0) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking user client access:", error);
    return false;
  }
}
async function getUserAccessibleClients(userId) {
  try {
    const clientIds = /* @__PURE__ */ new Set();
    const directClients = await db.select({ clientId: userAppAccess.clientId }).from(userAppAccess).where(
      and(
        eq(userAppAccess.userId, userId),
        eq(userAppAccess.isActive, true)
      )
    );
    directClients.forEach((c) => clientIds.add(c.clientId));
    const userGroups = await db.select({ groupId: accessGroupUsers.groupId }).from(accessGroupUsers).where(eq(accessGroupUsers.userId, userId));
    if (userGroups.length > 0) {
      const groupIds = userGroups.map((g) => g.groupId);
      for (const groupId of groupIds) {
        const groupClients = await db.select({ clientId: accessGroupClients.clientId }).from(accessGroupClients).where(eq(accessGroupClients.groupId, groupId));
        groupClients.forEach((c) => clientIds.add(c.clientId));
      }
    }
    return Array.from(clientIds);
  } catch (error) {
    console.error("Error getting user accessible clients:", error);
    return [];
  }
}
export {
  checkUserClientAccess,
  getUserAccessibleClients
};
