import { db, users, userRoles, roles, units } from "../../db/index";
import { desc, count, ilike, or, and, eq, inArray } from "drizzle-orm";

function parseQuery(event: any): Record<string, string> {
  const url = event.node.req.url || "";
  const queryString = url.split("?")[1] || "";
  const params: Record<string, string> = {};

  if (queryString) {
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }

  return params;
}

export default defineEventHandler(async (event) => {
  try {
    const query = parseQuery(event);
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(5000, Math.max(1, parseInt(query.limit) || 20));
    const search = query.search?.trim();
    const offset = (page - 1) * limit;

    // Build search condition
    const searchCondition =
      search && search.length >= 2
        ? or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.employeeId, `%${search}%`)
          )
        : undefined;

    // Get users with optional search filter
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        employeeId: users.employeeId,
        unitId: users.unitId,
        unitName: units.name,
        status: users.status,
        department: users.department,
        position: users.position,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(units, eq(users.unitId, units.id))
      .where(searchCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count with same filter
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(users)
      .where(searchCondition);

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
        total,
        page,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch users",
    });
  }
});
