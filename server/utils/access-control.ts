import { db, users, oidcClients, userAppAccess, accessGroupUsers, accessGroupClients } from '../db/index.ts'
import { eq, and } from 'drizzle-orm'

/**
 * Check if a user has access to a specific OIDC client
 * Checks both direct access and group-based access
 */
export async function checkUserClientAccess(userId: string, clientId: string): Promise<boolean> {
  try {
    // First, get the client to check if it requires access grant
    const [client] = await db
      .select({ requireAccessGrant: oidcClients.requireAccessGrant })
      .from(oidcClients)
      .where(eq(oidcClients.id, clientId))
      .limit(1)

    // If client doesn't require access grant, allow access
    if (!client || !client.requireAccessGrant) {
      return true
    }

    // Check direct user-to-client access
    const directAccess = await db
      .select({ id: userAppAccess.id })
      .from(userAppAccess)
      .where(
        and(
          eq(userAppAccess.userId, userId),
          eq(userAppAccess.clientId, clientId),
          eq(userAppAccess.isActive, true)
        )
      )
      .limit(1)

    if (directAccess.length > 0) {
      return true
    }

    // Check group-based access
    // Find all groups the user is a member of
    const userGroups = await db
      .select({ groupId: accessGroupUsers.groupId })
      .from(accessGroupUsers)
      .where(eq(accessGroupUsers.userId, userId))

    if (userGroups.length === 0) {
      return false
    }

    // Check if any of the user's groups has access to this client
    const groupIds = userGroups.map(g => g.groupId)
    
    for (const groupId of groupIds) {
      const groupClientAccess = await db
        .select({ id: accessGroupClients.id })
        .from(accessGroupClients)
        .where(
          and(
            eq(accessGroupClients.groupId, groupId),
            eq(accessGroupClients.clientId, clientId)
          )
        )
        .limit(1)

      if (groupClientAccess.length > 0) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking user client access:', error)
    return false
  }
}

/**
 * Get all clients a user has access to
 * Returns array of client IDs
 */
export async function getUserAccessibleClients(userId: string): Promise<string[]> {
  try {
    const clientIds = new Set<string>()

    // Get direct access clients
    const directClients = await db
      .select({ clientId: userAppAccess.clientId })
      .from(userAppAccess)
      .where(
        and(
          eq(userAppAccess.userId, userId),
          eq(userAppAccess.isActive, true)
        )
      )

    directClients.forEach(c => clientIds.add(c.clientId))

    // Get group-based access clients
    const userGroups = await db
      .select({ groupId: accessGroupUsers.groupId })
      .from(accessGroupUsers)
      .where(eq(accessGroupUsers.userId, userId))

    if (userGroups.length > 0) {
      const groupIds = userGroups.map(g => g.groupId)
      
      for (const groupId of groupIds) {
        const groupClients = await db
          .select({ clientId: accessGroupClients.clientId })
          .from(accessGroupClients)
          .where(eq(accessGroupClients.groupId, groupId))

        groupClients.forEach(c => clientIds.add(c.clientId))
      }
    }

    return Array.from(clientIds)
  } catch (error) {
    console.error('Error getting user accessible clients:', error)
    return []
  }
}
