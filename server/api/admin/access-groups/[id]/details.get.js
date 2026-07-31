import { defineEventHandler, createError } from "h3";
import { db, accessGroupUsers, accessGroupClients, users, oidcClients } from "../../../../db/index.js";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../../../../utils/auth.js";
var details_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const groupId = event.context.params?.id;
  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: "Group ID is required"
    });
  }
  try {
    const groupUsers = await db.select({
      id: accessGroupUsers.id,
      userId: accessGroupUsers.userId,
      addedBy: accessGroupUsers.addedBy,
      addedAt: accessGroupUsers.addedAt,
      userName: users.name,
      userEmail: users.email,
      userDepartment: users.department,
      userEmployeeId: users.employeeId
    }).from(accessGroupUsers).leftJoin(users, eq(accessGroupUsers.userId, users.id)).where(eq(accessGroupUsers.groupId, groupId));
    const groupClients = await db.select({
      id: accessGroupClients.id,
      clientId: accessGroupClients.clientId,
      addedBy: accessGroupClients.addedBy,
      addedAt: accessGroupClients.addedAt,
      clientName: oidcClients.name,
      clientDescription: oidcClients.description,
      clientIsActive: oidcClients.isActive
    }).from(accessGroupClients).leftJoin(oidcClients, eq(accessGroupClients.clientId, oidcClients.id)).where(eq(accessGroupClients.groupId, groupId));
    return {
      success: true,
      data: {
        users: groupUsers,
        clients: groupClients
      }
    };
  } catch (error) {
    console.error("Failed to get group details:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to get group details"
    });
  }
});
export {
  details_get_default as default
};
