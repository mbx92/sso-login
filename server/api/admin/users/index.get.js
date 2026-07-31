import { defineEventHandler, getQuery, createError } from "h3";
import { db, users, userRoles, roles, units } from "../../../db/index.js";
import { eq, count, like, or, desc, and } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth";
import { isSuperAdmin } from "../../../utils/roles";
var index_get_default = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const search = query.search?.trim();
  const offset = (page - 1) * limit;
  const authUser = getAuthUser(event);
  try {
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
          like(users.employeeId, `%${search}%`)
        )
      );
    }
    if (authUser && !isSuperAdmin(authUser) && authUser.siteId) {
      conditions.push(eq(units.siteId, authUser.siteId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [{ total }] = await db.select({ total: count() }).from(users).leftJoin(units, eq(users.unitId, units.id)).where(whereClause);
    const userList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      employeeId: users.employeeId,
      unitId: users.unitId,
      unitName: units.name,
      roleId: users.roleId,
      roleName: users.roleName,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).leftJoin(units, eq(users.unitId, units.id)).where(whereClause).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    const usersWithRoles = await Promise.all(
      userList.map(async (user) => {
        const userRolesResult = await db.select({ roleName: roles.name }).from(userRoles).innerJoin(roles, eq(userRoles.roleId, roles.id)).where(eq(userRoles.userId, user.id));
        const rolesFromJunction = userRolesResult.map((r) => r.roleName);
        return {
          ...user,
          roleName: user.roleName || rolesFromJunction[0] || null,
          roles: rolesFromJunction.length ? rolesFromJunction : (user.roleName ? [user.roleName] : [])
        };
      })
    );
    return {
      data: usersWithRoles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    event.context.logger?.error({ error }, "Failed to list users");
    throw createError({
      statusCode: 500,
      message: "Failed to fetch users"
    });
  }
});
export {
  index_get_default as default
};
