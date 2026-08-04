import { db, users, units, sites } from "../../db/index";
import { desc, count, ilike, or, eq } from "drizzle-orm";

function parseQuery(event) {
  const url = event.node.req.url || "";
  const queryString = url.split("?")[1] || "";
  const params = {};
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

var users_get_default = defineEventHandler(async (event) => {
  try {
    const query = parseQuery(event);
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(5e3, Math.max(1, parseInt(query.limit) || 20));
    const search = query.search?.trim();
    const offset = (page - 1) * limit;
    const searchCondition = search && search.length >= 2 ? or(
      ilike(users.name, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(users.employeeId, `%${search}%`)
    ) : void 0;
    const userList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      employeeId: users.employeeId,
      unitId: users.unitId,
      unitName: units.name,
      siteId: units.siteId,
      siteName: sites.name,
      status: users.status,
      department: users.department,
      position: users.position,
      avatarUrl: users.avatarUrl,
      roleId: users.roleId,
      roleName: users.roleName,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).leftJoin(units, eq(users.unitId, units.id)).leftJoin(sites, eq(units.siteId, sites.id)).where(searchCondition).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    const [{ value: total }] = await db.select({ value: count() }).from(users).where(searchCondition);
    return {
      data: userList,
      pagination: {
        total,
        page,
        limit,
        offset,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch users"
    });
  }
});
export {
  users_get_default as default
};
