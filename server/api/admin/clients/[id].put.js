import { defineEventHandler, getRouterParam, createError } from "h3";
import { db, oidcClients } from "../../../db/index.js";
import { eq } from "drizzle-orm";
import { writeAuditLog, AuditEvents } from "../../../services/audit.js";
import { getAuthUser } from "../../../utils/auth";
async function parseBody(event) {
  const req = event.node?.req || event.req;
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}
function getHeader(event, name) {
  const req = event.node?.req || event.req;
  return req.headers[name.toLowerCase()];
}
var id_put_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Client ID is required"
    });
  }
  const body = await parseBody(event);
  if (body.redirectUris) {
    for (const uri of body.redirectUris) {
      try {
        new URL(uri);
      } catch {
        throw createError({
          statusCode: 400,
          message: `Invalid redirect URI: ${uri}`
        });
      }
    }
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
        message: "Anda tidak memiliki akses untuk mengubah client ini"
      });
    }
    const updates = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (body.name !== void 0) updates.name = body.name.trim();
    else if (body.clientName !== void 0) updates.name = String(body.clientName).trim();
    if (body.description !== void 0) updates.description = body.description?.trim() || null;
    if (body.redirectUris !== void 0) updates.redirectUris = body.redirectUris;
    if (body.postLogoutRedirectUris !== void 0) updates.postLogoutRedirectUris = body.postLogoutRedirectUris;
    if (body.grantTypes !== void 0) updates.grantTypes = body.grantTypes;
    if (body.responseTypes !== void 0) updates.responseTypes = body.responseTypes;
    if (body.scopes !== void 0) updates.scopes = body.scopes;
    if (body.tokenEndpointAuthMethod !== void 0) {
      updates.tokenEndpointAuthMethod = body.tokenEndpointAuthMethod;
      if (body.tokenEndpointAuthMethod === "none") {
        updates.clientSecretHash = null;
      }
    }
    if (body.isFirstParty !== void 0) updates.isFirstParty = body.isFirstParty;
    if (body.isActive !== void 0) updates.isActive = body.isActive;
    if (body.requireAccessGrant !== void 0) updates.requireAccessGrant = body.requireAccessGrant;
    if (body.accessControlEnabled !== void 0) updates.requireAccessGrant = !!body.accessControlEnabled;
    if (body.homepageUrl !== void 0) {
      const raw = typeof body.homepageUrl === "string" ? body.homepageUrl.trim() : body.homepageUrl;
      if (raw) {
        try {
          new URL(raw);
        } catch {
          throw createError({ statusCode: 400, message: `Invalid homepage URL: ${raw}` });
        }
      }
      updates.homepageUrl = raw || null;
    }
    const [updated] = await db.update(oidcClients).set(updates).where(eq(oidcClients.id, id)).returning();
    await writeAuditLog({
      action: AuditEvents.ADMIN_CLIENT_UPDATED,
      targetType: "oidc_client",
      targetId: id,
      ip: getHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        clientId: existing.clientId,
        changes: Object.keys(updates).filter((k) => k !== "updatedAt")
      }
    });
    return {
      success: true,
      client: {
        id: updated.id,
        clientId: updated.clientId,
        name: updated.name,
        description: updated.description,
        homepageUrl: updated.homepageUrl,
        redirectUris: updated.redirectUris,
        postLogoutRedirectUris: updated.postLogoutRedirectUris,
        grantTypes: updated.grantTypes,
        responseTypes: updated.responseTypes,
        scopes: updated.scopes,
        tokenEndpointAuthMethod: updated.tokenEndpointAuthMethod,
        isFirstParty: updated.isFirstParty,
        isActive: updated.isActive,
        requireAccessGrant: updated.requireAccessGrant,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    };
  } catch (error) {
    event.context.logger?.error({ error }, "Failed to update client");
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Failed to update client"
    });
  }
});
export {
  id_put_default as default
};
