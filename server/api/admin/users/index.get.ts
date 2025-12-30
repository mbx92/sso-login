import { defineEventHandler, getQuery, createError } from 'h3'
import { db, users, userRoles, roles } from '../../../db/index.ts'
import { eq, count, like, or, desc, sql } from 'drizzle-orm'

/**
 * List users with pagination
 * GET /api/admin/users?page=1&limit=20&search=...
 */
export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware check
  
  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const search = (query.search as string)?.trim()
  const offset = (page - 1) * limit

  try {
    // Build where clause
    const whereClause = search
      ? or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.employeeId, `%${search}%`)
        )
      : undefined

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause)

    // Get users with their roles
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        employeeId: users.employeeId,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      userList.map(async (user) => {
        const userRolesResult = await db
          .select({ roleName: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, user.id))

        return {
          ...user,
          roles: userRolesResult.map(r => r.roleName)
        }
      })
    )

    return {
      data: usersWithRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to list users')
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch users'
    })
  }
})
