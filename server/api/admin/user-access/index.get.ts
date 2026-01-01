import { defineEventHandler, createError } from 'h3'
import { db, userAppAccess, users, oidcClients } from '../../../db/index.ts'
import { eq, and, desc, or, isNull } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth.ts'
import { isSuperAdmin } from '../../../utils/roles.ts'

/**
 * Get all user-app access grants
 * GET /api/admin/user-access
 * Query params:
 *   - userId: filter by user ID
 *   - clientId: filter by client ID (UUID)
 * 
 * Admin hanya bisa melihat access untuk user di site mereka dan client di site mereka
 * Superadmin bisa melihat semua access
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const url = new URL(event.node.req.url || '', `http://${event.node.req.headers.host}`)
  const userId = url.searchParams.get('userId')
  const clientId = url.searchParams.get('clientId')

  try {
    // Build conditions
    const conditions = []
    
    if (userId) {
      conditions.push(eq(userAppAccess.userId, userId))
    }

    if (clientId) {
      conditions.push(eq(userAppAccess.clientId, clientId))
    }

    // Site filter for non-superadmin
    if (user && !isSuperAdmin(user) && user.siteId) {
      // Filter: only show access where user is in same site OR client is in same site
      conditions.push(
        or(
          eq(users.siteId, user.siteId),
          eq(oidcClients.siteId, user.siteId)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const grants = await db
      .select({
        id: userAppAccess.id,
        userId: userAppAccess.userId,
        clientId: userAppAccess.clientId,
        grantedBy: userAppAccess.grantedBy,
        grantedAt: userAppAccess.grantedAt,
        expiresAt: userAppAccess.expiresAt,
        isActive: userAppAccess.isActive,
        notes: userAppAccess.notes,
        userName: users.name,
        userEmail: users.email,
        userDepartment: users.department,
        clientName: oidcClients.name,
        clientDescription: oidcClients.description
      })
      .from(userAppAccess)
      .leftJoin(users, eq(userAppAccess.userId, users.id))
      .leftJoin(oidcClients, eq(userAppAccess.clientId, oidcClients.id))
      .where(whereClause)
      .orderBy(desc(userAppAccess.grantedAt))

    return {
      success: true,
      data: grants
    }
  } catch (error: any) {
    console.error('Failed to get user access grants:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get user access grants'
    })
  }
})
