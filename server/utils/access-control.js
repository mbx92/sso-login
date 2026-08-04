import { db, oidcClients, userAppAccess, accessGroupUsers, accessGroupClients, accessGroups } from "../db/index.js";
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
    const userGroups = await db.select({ groupId: accessGroupUsers.groupId }).from(accessGroupUsers).innerJoin(accessGroups, eq(accessGroupUsers.groupId, accessGroups.id)).where(
      and(
        eq(accessGroupUsers.userId, userId),
        eq(accessGroups.isActive, true)
      )
    );
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
    const userGroups = await db.select({ groupId: accessGroupUsers.groupId }).from(accessGroupUsers).innerJoin(accessGroups, eq(accessGroupUsers.groupId, accessGroups.id)).where(
      and(
        eq(accessGroupUsers.userId, userId),
        eq(accessGroups.isActive, true)
      )
    );
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

function deriveHomepageUrl(client) {
  // If client has explicit homepage URL (preferably SSO login endpoint), use it
  if (client.homepageUrl) return client.homepageUrl;

  // Otherwise auto-generate SSO login endpoint from redirect URI
  const first = client.redirectUris?.[0];
  if (!first) return null;
  try {
    const callbackUrl = new URL(first); // e.g. http://localhost:3000/api/auth/sso/callback
    // Construct SSO login endpoint: same origin, /api/auth/sso/login
    return `${callbackUrl.origin}/api/auth/sso/login`;
  } catch {
    return null;
  }
}

/**
 * Apps shown on the end-user portal after login.
 * Active clients the user may access, with a launch URL.
 */
async function getUserPortalApps(userId) {
  const all = await db.select({
    id: oidcClients.id,
    clientId: oidcClients.clientId,
    name: oidcClients.name,
    description: oidcClients.description,
    homepageUrl: oidcClients.homepageUrl,
    redirectUris: oidcClients.redirectUris,
    requireAccessGrant: oidcClients.requireAccessGrant,
    isActive: oidcClients.isActive,
  }).from(oidcClients).where(eq(oidcClients.isActive, true));

  const apps = [];
  for (const client of all) {
    const allowed = await checkUserClientAccess(userId, client.id);
    if (!allowed) continue;
    const url = deriveHomepageUrl(client);
    if (!url) continue;
    apps.push({
      id: client.id,
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      homepageUrl: url,
      requireAccessGrant: client.requireAccessGrant,
    });
  }
  apps.sort((a, b) => a.name.localeCompare(b.name));
  return apps;
}
export {
  checkUserClientAccess,
  getUserAccessibleClients,
  getUserPortalApps,
  deriveHomepageUrl,
};
