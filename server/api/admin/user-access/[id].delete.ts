import { defineEventHandler, createError } from 'h3'
import { db, userAppAccess, users, oidcClients } from '../../../db/index.ts'
import { eq } from 'drizzle-orm'
import { writeAuditLog } from '../../../services/audit.ts'

/**
 * Get session user from cookie
 */
function getSessionUser(event: any): { userId: string; name: string } | null {
  const cookies = event.node?.req?.headers?.cookie || ''
  const userCookie = cookies.split(';').find((c: string) => c.trim().startsWith('sso_user='))
  if (!userCookie) return null

  try {
    const userDataStr = decodeURIComponent(userCookie.split('=')[1])
    return JSON.parse(userDataStr)
  } catch {
    return null
  }
}

/**
 * Revoke user access to an application
 * DELETE /api/admin/user-access/[id]
 */
export default defineEventHandler(async (event) => {
  const url = new URL(event.node.req.url || '', `http://${event.node.req.headers.host}`)
  const pathParts = url.pathname.split('/')
  const accessId = pathParts[pathParts.length - 1]

  if (!accessId) {
    throw createError({
      statusCode: 400,
      message: 'Access ID is required'
    })
  }

  try {
    // Get access record with user and client info
    const [existingAccess] = await db
      .select({
        id: userAppAccess.id,
        userId: userAppAccess.userId,
        clientId: userAppAccess.clientId,
        userName: users.name,
        clientName: oidcClients.name
      })
      .from(userAppAccess)
      .leftJoin(users, eq(userAppAccess.userId, users.id))
      .leftJoin(oidcClients, eq(userAppAccess.clientId, oidcClients.id))
      .where(eq(userAppAccess.id, accessId))
      .limit(1)

    if (!existingAccess) {
      throw createError({
        statusCode: 404,
        message: 'Access grant not found'
      })
    }

    // Delete the access
    await db
      .delete(userAppAccess)
      .where(eq(userAppAccess.id, accessId))

    // Get current admin user
    const sessionUser = getSessionUser(event)

    // Audit log
    await writeAuditLog({
      action: 'ADMIN_USER_ACCESS_REVOKED' as any,
      actorUserId: sessionUser?.userId,
      targetType: 'user_app_access',
      targetId: accessId,
      metadata: {
        userId: existingAccess.userId,
        userName: existingAccess.userName,
        clientId: existingAccess.clientId,
        clientName: existingAccess.clientName
      }
    })

    return {
      success: true,
      message: `Access revoked for ${existingAccess.userName} from ${existingAccess.clientName}`
    }
  } catch (error: any) {
    console.error('Failed to revoke user access:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to revoke user access'
    })
  }
})
