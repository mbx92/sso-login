import { defineEventHandler, createError } from "h3";
import { db, accessGroups, accessGroupUsers, accessGroupClients } from "../../../db/index.js";
import { eq, and, or, isNull, desc, count } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth.js";
import { isSuperAdmin } from "../../../utils/roles.js";
var index_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  try {
    const conditions = [];
    if (user && !isSuperAdmin(user) && user.siteId) {
      conditions.push(
        or(
          eq(accessGroups.siteId, user.siteId),
          isNull(accessGroups.siteId)
        )
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const groups = await db.select({
      id: accessGroups.id,
      name: accessGroups.name,
      description: accessGroups.description,
      siteId: accessGroups.siteId,
      isActive: accessGroups.isActive,
      createdBy: accessGroups.createdBy,
      createdAt: accessGroups.createdAt,
      updatedAt: accessGroups.updatedAt
    }).from(accessGroups).where(whereClause).orderBy(desc(accessGroups.createdAt));
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const [usersCountResult, clientsCountResult] = await Promise.all([
          db.select({ count: count() }).from(accessGroupUsers).where(eq(accessGroupUsers.groupId, group.id)),
          db.select({ count: count() }).from(accessGroupClients).where(eq(accessGroupClients.groupId, group.id))
        ]);
        return {
          ...group,
          usersCount: Number(usersCountResult[0]?.count || 0),
          clientsCount: Number(clientsCountResult[0]?.count || 0)
        };
      })
    );
    return {
      success: true,
      data: groupsWithCounts
    };
  } catch (error) {
    console.error("Failed to get access groups:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to get access groups"
    });
  }
});
export {
  index_get_default as default
};
