import { db, userRoles, users, roles } from '../../../../db'
import { eq } from 'drizzle-orm'

/**
 * Get users assigned to a role
 * GET /api/admin/roles/:id/users
 */
export default defineEventHandler(async (event) => {
  const roleId = getRouterParam(event, 'id')
  
  if (!roleId) {
    throw createError({
      statusCode: 400,
      message: 'Role ID is required'
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

    const usersWithRole = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        employeeId: users.employeeId,
        status: users.status
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId))

    return {
      role: {
        id: role.id,
        name: role.name
      },
      data: usersWithRole,
      total: usersWithRole.length
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    event.context.logger?.error({ error }, 'Failed to get role users')
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch role users'
    })
  }
})
