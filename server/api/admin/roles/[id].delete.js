import { eq } from "drizzle-orm";
import { db, roles, userRoles } from "../../../db";
import { getAuthUser } from "../../../utils/auth";
import { isSuperAdmin } from "../../../utils/roles";
var id_delete_default = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const user = getAuthUser(event);
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID role tidak valid"
    });
  }
  try {
    const [existingRole] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!existingRole) {
      throw createError({
        statusCode: 404,
        message: "Role tidak ditemukan"
      });
    }
    if (existingRole.isSystem) {
      throw createError({
        statusCode: 403,
        message: "Role sistem tidak dapat dihapus"
      });
    }
    if (user && !isSuperAdmin(user) && user.siteId) {
      if (existingRole.siteId && existingRole.siteId !== user.siteId) {
        throw createError({
          statusCode: 403,
          message: "Anda tidak memiliki akses untuk menghapus role ini"
        });
      }
    }
    const usersWithRole = await db.select().from(userRoles).where(eq(userRoles.roleId, id)).limit(1);
    if (usersWithRole.length > 0) {
      throw createError({
        statusCode: 400,
        message: "Role tidak dapat dihapus karena masih digunakan oleh user"
      });
    }
    const [deletedRole] = await db.delete(roles).where(eq(roles.id, id)).returning();
    return {
      success: true,
      message: "Role berhasil dihapus"
    };
  } catch (error) {
    console.error("Error deleting role:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: `Gagal menghapus role: ${error.message || "Unknown error"}`
    });
  }
});
export {
  id_delete_default as default
};
