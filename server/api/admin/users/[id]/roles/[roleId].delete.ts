import { db, userRoles, users, roles } from '../../../../../db'
import { eq, and } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../../../services/audit'
import { getAuthUser } from '../../../../../utils/auth'

/**
 * Remove role from a user
 * DELETE /api/admin/users/:id/roles/:roleId
 */
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  const roleId = getRouterParam(event, 'roleId')
  const authUser = getAuthUser(event)
  
  if (!userId || !roleId) {
    throw createError({
      statusCode: 400,
      message: 'User ID and Role ID are required'
    })
  }

  try {
    // Get user and role info for audit
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)

    // Check if assignment exists
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1)

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Role assignment not found'
      })
    }

    // Remove role
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))

    // Audit log
    await writeAuditLog({
      action: AuditEvents.ADMIN_USER_ROLE_REMOVED,
      targetType: 'user',
      targetId: userId,
      actorUserId: authUser?.userId,
      metadata: { roleId, roleName: role?.name, userName: user?.name }
    })

    return {
      success: true,
      message: `Role removed from user`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    event.context.logger?.error({ error }, 'Failed to remove role from user')
    throw createError({
      statusCode: 500,
      message: 'Failed to remove role'
    })
  }
})
