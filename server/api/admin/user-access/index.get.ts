import { defineEventHandler, createError } from 'h3'
import { db, userAppAccess, users, oidcClients } from '../../../db/index.ts'
import { eq, and, desc } from 'drizzle-orm'

/**
 * Get all user-app access grants
 * GET /api/admin/user-access
 * Query params:
 *   - userId: filter by user ID
 *   - clientId: filter by client ID (UUID)
 */
export default defineEventHandler(async (event) => {
  const url = new URL(event.node.req.url || '', `http://${event.node.req.headers.host}`)
  const userId = url.searchParams.get('userId')
  const clientId = url.searchParams.get('clientId')

  try {
    let query = db
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
      .orderBy(desc(userAppAccess.grantedAt))

    if (userId) {
      query = query.where(eq(userAppAccess.userId, userId)) as typeof query
    }

    if (clientId) {
      query = query.where(eq(userAppAccess.clientId, clientId)) as typeof query
    }

    const grants = await query

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
