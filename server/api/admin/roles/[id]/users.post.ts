import { db, userRoles, users, roles } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../../services/audit'
import { getAuthUser } from '../../../../utils/auth'

/**
 * Assign user to a role
 * POST /api/admin/roles/:id/users
 * Body: { userId: string }
 */
export default defineEventHandler(async (event) => {
  const roleId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { userId } = body as { userId: string }
  const authUser = getAuthUser(event)
  
  if (!roleId) {
    throw createError({
      statusCode: 400,
      message: 'Role ID is required'
    })
  }

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  try {
    // Verify role exists
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
    if (!role) {
      throw createError({
        statusCode: 404,
        message: 'Role not found'
      })
    }

    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    // Check if already assigned
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .limit(1)

    if (existing) {
      throw createError({
        statusCode: 409,
        message: 'User already has this role'
      })
    }

    // Assign role
    await db.insert(userRoles).values({
      userId,
      roleId
    })

    // Audit log
    await writeAuditLog({
      action: AuditEvents.ADMIN_USER_ROLE_ASSIGNED,
      targetType: 'role',
      targetId: roleId,
      actorUserId: authUser?.userId,
      metadata: { userId, userName: user.name, roleName: role.name }
    })

    return {
      success: true,
      message: `User "${user.name}" assigned to role`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    event.context.logger?.error({ error }, 'Failed to assign user to role')
    throw createError({
      statusCode: 500,
      message: 'Failed to assign user'
    })
  }
})
