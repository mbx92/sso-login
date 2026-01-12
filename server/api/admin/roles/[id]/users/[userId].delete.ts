import { db, userRoles, users, roles } from '../../../../../db'
import { eq, and } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../../../services/audit'
import { getAuthUser } from '../../../../../utils/auth'

/**
 * Remove user from a role
 * DELETE /api/admin/roles/:id/users/:userId
 */
export default defineEventHandler(async (event) => {
  const roleId = getRouterParam(event, 'id')
  const userId = getRouterParam(event, 'userId')
  const authUser = getAuthUser(event)
  
  if (!roleId || !userId) {
    throw createError({
      statusCode: 400,
      message: 'Role ID and User ID are required'
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
        message: 'User role assignment not found'
      })
    }

    // Remove role
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))

    // Audit log
    await writeAuditLog({
      action: AuditEvents.ADMIN_USER_ROLE_REMOVED,
      targetType: 'role',
      targetId: roleId,
      actorUserId: authUser?.userId,
      metadata: { userId, userName: user?.name, roleName: role?.name }
    })

    return {
      success: true,
      message: `User removed from role`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    event.context.logger?.error({ error }, 'Failed to remove user from role')
    throw createError({
      statusCode: 500,
      message: 'Failed to remove user'
    })
  }
})
