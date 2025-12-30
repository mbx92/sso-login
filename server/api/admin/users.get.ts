import { db, users } from '../../db/index'
import { desc, count, eq } from 'drizzle-orm'

function parseQuery(event: any): Record<string, string> {
  const url = event.node.req.url || ''
  const queryString = url.split('?')[1] || ''
  const params: Record<string, string> = {}
  
  if (queryString) {
    const pairs = queryString.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }
  }
  
  return params
}

export default defineEventHandler(async (event) => {
  try {
    const query = parseQuery(event)
    const page = Math.max(1, parseInt(query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))
    const search = query.search?.trim()
    const offset = (page - 1) * limit

    // Get users
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        employeeId: users.employeeId,
        status: users.status,
        department: users.department,
        position: users.position,
        avatarUrl: users.avatarUrl,
        roleId: users.roleId,
        roleName: users.roleName,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(users)

    return {
      data: userList,
      pagination: {
        total,
        page,
        limit,
        offset,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch users'
    })
  }
})
