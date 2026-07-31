import { defineEventHandler, createError } from "h3";
import { db, oidcClients } from "../../../db/index.js";
import { v4 as uuidv4 } from "uuid";
import * as argon2 from "argon2";
import { writeAuditLog, AuditEvents } from "../../../services/audit.js";
import { getAuthUser } from "../../../utils/auth.js";
import { isSuperAdmin } from "../../../utils/roles.js";
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
var index_post_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const body = await parseBody(event);
  const clientName = body.name || body.clientName;
  if (!clientName?.trim()) {
    throw createError({
      statusCode: 400,
      message: "Client name is required"
    });
  }
  if (!body.redirectUris || body.redirectUris.length === 0) {
    throw createError({
      statusCode: 400,
      message: "At least one redirect URI is required"
    });
  }
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
  try {
    const clientId = `sso_${uuidv4().replace(/-/g, "").substring(0, 24)}`;
    const clientSecret = uuidv4().replace(/-/g, "") + uuidv4().replace(/-/g, "");
    const authMethod = body.tokenEndpointAuthMethod || "client_secret_basic";
    const isPublicClient = authMethod === "none";
    let clientSecretHash = null;
    if (!isPublicClient) {
      clientSecretHash = await argon2.hash(clientSecret, {
        type: argon2.argon2id
      });
    }
    let clientSiteId = null;
    if (user) {
      if (isSuperAdmin(user)) {
        clientSiteId = body.siteId || null;
      } else if (user.siteId) {
        clientSiteId = user.siteId;
      }
    }
    const [newClient] = await db.insert(oidcClients).values({
      clientId,
      clientSecretHash,
      name: clientName.trim(),
      description: body.description?.trim() || null,
      redirectUris: body.redirectUris,
      postLogoutRedirectUris: body.postLogoutRedirectUris || [],
      grantTypes: body.grantTypes || ["authorization_code"],
      responseTypes: body.responseTypes || ["code"],
      scopes: body.scopes || ["openid", "profile", "email"],
      tokenEndpointAuthMethod: authMethod,
      isFirstParty: body.isFirstParty || false,
      isActive: true,
      siteId: clientSiteId
    }).returning();
    await writeAuditLog({
      action: AuditEvents.ADMIN_CLIENT_CREATED,
      // actorUserId: TODO: get from session
      targetType: "oidc_client",
      targetId: newClient.id,
      ip: getHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        clientId,
        name: newClient.name
      }
    });
    return {
      success: true,
      client: {
        id: newClient.id,
        clientId: newClient.clientId,
        clientSecret: isPublicClient ? null : clientSecret,
        // Only return once!
        name: newClient.name,
        description: newClient.description,
        redirectUris: newClient.redirectUris,
        postLogoutRedirectUris: newClient.postLogoutRedirectUris,
        grantTypes: newClient.grantTypes,
        responseTypes: newClient.responseTypes,
        scopes: newClient.scopes,
        tokenEndpointAuthMethod: newClient.tokenEndpointAuthMethod,
        isFirstParty: newClient.isFirstParty,
        isActive: newClient.isActive
      },
      message: isPublicClient ? "Client created successfully (public client - no secret)" : "Client created successfully. Save the client_secret now - it will not be shown again!"
    };
  } catch (error) {
    console.error("Create client error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    event.context.logger?.error({ error }, "Failed to create client");
    if (error.code === "23505") {
      throw createError({
        statusCode: 409,
        message: "Client with this ID already exists"
      });
    }
    throw createError({
      statusCode: 500,
      message: `Failed to create client: ${error.message}`
    });
  }
});
export {
  index_post_default as default
};
