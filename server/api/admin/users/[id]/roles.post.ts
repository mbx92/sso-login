import { db, userRoles, users, roles } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../../services/audit'
import { getAuthUser } from '../../../../utils/auth'

/**
 * Assign role to a user
 * POST /api/admin/users/:id/roles
 * Body: { roleId: string }
 */
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { roleId } = body as { roleId: string }
  const authUser = getAuthUser(event)
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  if (!roleId) {
    throw createError({
      statusCode: 400,
      message: 'Role ID is required'
    })
  }

  try {
    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    // Verify role exists
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1)
    if (!role) {
      throw createError({
        statusCode: 404,
        message: 'Role not found'
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
        message: 'Role already assigned to this user'
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
      targetType: 'user',
      targetId: userId,
      actorUserId: authUser?.userId,
      metadata: { roleId, roleName: role.name, userName: user.name }
    })

    return {
      success: true,
      message: `Role "${role.name}" assigned to user`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    event.context.logger?.error({ error }, 'Failed to assign role to user')
    throw createError({
      statusCode: 500,
      message: 'Failed to assign role'
    })
  }
})
