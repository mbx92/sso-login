import { db, users, userRoles, roles, units } from '../../../db/index'
import { eq, count, like, or, desc, sql, and, inArray } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roles'

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
  const authUser = getAuthUser(event)

  try {
    // Build where clause
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.employeeId, `%${search}%`)
        )
      )
    }
    
    // Filter by user's site if not superadmin AND user has siteId
    // (jika user tidak punya siteId, tampilkan semua untuk backward compatibility)
    if (authUser && !isSuperAdmin(authUser) && authUser.siteId) {
      conditions.push(eq(units.siteId, authUser.siteId))
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .leftJoin(units, eq(users.unitId, units.id))
      .where(whereClause)

    // Get users with their unit info
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        employeeId: users.employeeId,
        unitId: users.unitId,
        unitName: units.name,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .leftJoin(units, eq(users.unitId, units.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    // Get roles for all users in one query
    const userIds = userList.map(u => u.id)
    const rolesMap = new Map<string, string[]>()
    
    if (userIds.length > 0) {
      const allRoles = await db
        .select({
          userId: userRoles.userId,
          roleName: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(inArray(userRoles.userId, userIds))
      
      for (const r of allRoles) {
        const current = rolesMap.get(r.userId) || []
        current.push(r.roleName)
        rolesMap.set(r.userId, current)
      }
    }

    const usersWithRoles = userList.map(user => ({
      ...user,
      roles: rolesMap.get(user.id) || []
    }))
    
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
