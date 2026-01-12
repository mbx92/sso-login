import { db, roles, sites, userRoles, PERMISSIONS } from '../../../db'
import { eq, and, isNull, or, desc, count, sql } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  try {
    let whereClause
    
    // Superadmin atau user tanpa siteId bisa lihat semua roles
    if (!user || isSuperAdmin(user) || !user.siteId) {
      // Tampilkan semua roles (global + semua site)
      whereClause = undefined
    } else {
      // Admin site hanya lihat roles global dan roles site mereka
      whereClause = or(
        isNull(roles.siteId),
        eq(roles.siteId, user.siteId)
      )
    }
    
    const roleList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissions: roles.permissions,
        siteId: roles.siteId,
        siteName: sites.name,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt
      })
      .from(roles)
      .leftJoin(sites, eq(roles.siteId, sites.id))
      .where(whereClause)
      .orderBy(desc(roles.createdAt))
    
    // Get user counts for each role
    const userCounts = await db
      .select({
        roleId: userRoles.roleId,
        count: count()
      })
      .from(userRoles)
      .groupBy(userRoles.roleId)
    
    const countMap = new Map(userCounts.map(uc => [uc.roleId, uc.count]))
    
    const rolesWithCount = roleList.map(role => ({
      ...role,
      userCount: countMap.get(role.id) || 0
    }))
    
    // Return available permissions list too
    return {
      data: rolesWithCount,
      permissions: Object.entries(PERMISSIONS).map(([key, value]) => ({
        key,
        value,
        category: value.split('.')[0],
        action: value.split('.')[1]
      }))
    }
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch roles'
    })
  }
})
