import { defineEventHandler, createError } from 'h3'
import { db, accessGroups, accessGroupUsers, accessGroupClients, oidcClients, users } from '../../../db/index.ts'
import { eq, and, or, isNull, desc, count } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth.ts'
import { isSuperAdmin } from '../../../utils/roles.ts'

/**
 * Get all access groups with their users and clients count
 * GET /api/admin/access-groups
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)

  try {
    // Build conditions for site filtering
    const conditions = []
    
    if (user && !isSuperAdmin(user) && user.siteId) {
      conditions.push(
        or(
          eq(accessGroups.siteId, user.siteId),
          isNull(accessGroups.siteId)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get all groups
    const groups = await db
      .select({
        id: accessGroups.id,
        name: accessGroups.name,
        description: accessGroups.description,
        siteId: accessGroups.siteId,
        isActive: accessGroups.isActive,
        createdBy: accessGroups.createdBy,
        createdAt: accessGroups.createdAt,
        updatedAt: accessGroups.updatedAt
      })
      .from(accessGroups)
      .where(whereClause)
      .orderBy(desc(accessGroups.createdAt))

    // Get counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const [usersCountResult, clientsCountResult] = await Promise.all([
          db.select({ count: count() })
            .from(accessGroupUsers)
            .where(eq(accessGroupUsers.groupId, group.id)),
          db.select({ count: count() })
            .from(accessGroupClients)
            .where(eq(accessGroupClients.groupId, group.id))
        ])

        return {
          ...group,
          usersCount: Number(usersCountResult[0]?.count || 0),
          clientsCount: Number(clientsCountResult[0]?.count || 0)
        }
      })
    )

    return {
      success: true,
      data: groupsWithCounts
    }
  } catch (error: any) {
    console.error('Failed to get access groups:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get access groups'
    })
  }
})
