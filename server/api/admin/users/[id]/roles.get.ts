import { db, userRoles, roles } from '../../../../db'
import { eq } from 'drizzle-orm'

/**
 * Get roles assigned to a user
 * GET /api/admin/users/:id/roles
 */
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  try {
    const userRolesResult = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    return {
      data: userRolesResult
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to get user roles')
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user roles'
    })
  }
})
