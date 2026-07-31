import { defineEventHandler, getQuery, createError } from "h3";
import { db, oidcClients } from "../../../db/index.js";
import { count, like, desc, eq, and } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth.js";
import { isSuperAdmin } from "../../../utils/roles.js";
var index_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const query = getQuery(event);
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const search = query.search?.trim();
  const offset = (page - 1) * limit;
  try {
    const conditions = [];
    if (search) {
      conditions.push(like(oidcClients.name, `%${search}%`));
    }
    if (user && !isSuperAdmin(user) && user.siteId) {
      conditions.push(eq(oidcClients.siteId, user.siteId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [{ total }] = await db.select({ total: count() }).from(oidcClients).where(whereClause);
    const clientList = await db.select({
      id: oidcClients.id,
      clientId: oidcClients.clientId,
      name: oidcClients.name,
      description: oidcClients.description,
      homepageUrl: oidcClients.homepageUrl,
      redirectUris: oidcClients.redirectUris,
      postLogoutRedirectUris: oidcClients.postLogoutRedirectUris,
      grantTypes: oidcClients.grantTypes,
      responseTypes: oidcClients.responseTypes,
      scopes: oidcClients.scopes,
      tokenEndpointAuthMethod: oidcClients.tokenEndpointAuthMethod,
      isFirstParty: oidcClients.isFirstParty,
      requireAccessGrant: oidcClients.requireAccessGrant,
      isActive: oidcClients.isActive,
      createdAt: oidcClients.createdAt,
      updatedAt: oidcClients.updatedAt
    }).from(oidcClients).where(whereClause).orderBy(desc(oidcClients.createdAt)).limit(limit).offset(offset);
    return {
      data: clientList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    event.context.logger?.error({ error }, "Failed to list clients");
    throw createError({
      statusCode: 500,
      message: "Failed to fetch clients"
    });
  }
});
export {
  index_get_default as default
};
