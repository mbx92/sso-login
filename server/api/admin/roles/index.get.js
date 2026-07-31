import { db, roles, sites, PERMISSIONS } from "../../../db";
import { eq, isNull, or, desc } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth";
import { isSuperAdmin } from "../../../utils/roles";
var index_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  try {
    let whereClause;
    if (!user || isSuperAdmin(user) || !user.siteId) {
      whereClause = void 0;
    } else {
      whereClause = or(
        isNull(roles.siteId),
        eq(roles.siteId, user.siteId)
      );
    }
    const roleList = await db.select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      permissions: roles.permissions,
      siteId: roles.siteId,
      siteName: sites.name,
      isSystem: roles.isSystem,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt
    }).from(roles).leftJoin(sites, eq(roles.siteId, sites.id)).where(whereClause).orderBy(desc(roles.createdAt));
    return {
      data: roleList,
      permissions: Object.entries(PERMISSIONS).map(([key, value]) => ({
        key,
        value,
        category: value.split(".")[0],
        action: value.split(".")[1]
      }))
    };
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch roles"
    });
  }
});
export {
  index_get_default as default
};
