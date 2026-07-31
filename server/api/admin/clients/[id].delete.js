import { defineEventHandler, getRouterParam, createError } from "h3";
import { db, oidcClients } from "../../../db/index.js";
import { eq } from "drizzle-orm";
import { writeAuditLog, AuditEvents } from "../../../services/audit.js";
import { getAuthUser } from "../../../utils/auth";
function getHeader(event, name) {
  const req = event.node?.req || event.req;
  return req.headers[name.toLowerCase()];
}
var id_delete_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Client ID is required"
    });
  }
  try {
    const [existing] = await db.select().from(oidcClients).where(eq(oidcClients.id, id)).limit(1);
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: "Client not found"
      });
    }
    if (user?.roleId !== "superadmin" && user?.siteId && existing.siteId && existing.siteId !== user.siteId) {
      throw createError({
        statusCode: 403,
        message: "Anda tidak memiliki akses untuk menghapus client ini"
      });
    }
    await db.delete(oidcClients).where(eq(oidcClients.id, id));
    await writeAuditLog({
      action: AuditEvents.ADMIN_CLIENT_DELETED,
      targetType: "oidc_client",
      targetId: id,
      ip: getHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        clientId: existing.clientId,
        name: existing.name
      }
    });
    return {
      success: true,
      message: `Client "${existing.name}" deleted successfully`
    };
  } catch (error) {
    console.error("Delete client error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    event.context.logger?.error({ error }, "Failed to delete client");
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: `Failed to delete client: ${error.message || "Unknown error"}`
    });
  }
});
export {
  id_delete_default as default
};
