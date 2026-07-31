import { defineEventHandler, createError } from "h3";
import { db, accessGroups } from "../../../db/index.js";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth.js";
var id_delete_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const groupId = event.context.params?.id;
  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: "Group ID is required"
    });
  }
  try {
    const [deletedGroup] = await db.delete(accessGroups).where(eq(accessGroups.id, groupId)).returning();
    if (!deletedGroup) {
      throw createError({
        statusCode: 404,
        message: "Group not found"
      });
    }
    return {
      success: true,
      data: deletedGroup
    };
  } catch (error) {
    console.error("Failed to delete access group:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to delete access group"
    });
  }
});
export {
  id_delete_default as default
};
