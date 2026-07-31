import { defineEventHandler, createError } from "h3";
import { db, userAppAccess, users, oidcClients } from "../../../db/index.js";
import { eq, and, desc, or, isNull } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth.js";
import { isSuperAdmin } from "../../../utils/roles.js";
var index_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const url = new URL(event.node.req.url || "", `http://${event.node.req.headers.host}`);
  const userId = url.searchParams.get("userId");
  const clientId = url.searchParams.get("clientId");
  try {
    const conditions = [];
    if (userId) {
      conditions.push(eq(userAppAccess.userId, userId));
    }
    if (clientId) {
      conditions.push(eq(userAppAccess.clientId, clientId));
    }
    if (user && !isSuperAdmin(user) && user.siteId) {
      conditions.push(
        or(
          eq(oidcClients.siteId, user.siteId),
          isNull(oidcClients.siteId)
        )
      );
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const grants = await db.select({
      id: userAppAccess.id,
      userId: userAppAccess.userId,
      clientId: userAppAccess.clientId,
      grantedBy: userAppAccess.grantedBy,
      grantedAt: userAppAccess.grantedAt,
      expiresAt: userAppAccess.expiresAt,
      isActive: userAppAccess.isActive,
      notes: userAppAccess.notes,
      userName: users.name,
      userEmail: users.email,
      userDepartment: users.department,
      clientName: oidcClients.name,
      clientDescription: oidcClients.description
    }).from(userAppAccess).leftJoin(users, eq(userAppAccess.userId, users.id)).leftJoin(oidcClients, eq(userAppAccess.clientId, oidcClients.id)).where(whereClause).orderBy(desc(userAppAccess.grantedAt));
    return {
      success: true,
      data: grants
    };
  } catch (error) {
    console.error("Failed to get user access grants:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to get user access grants"
    });
  }
});
export {
  index_get_default as default
};
