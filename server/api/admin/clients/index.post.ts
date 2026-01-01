import { defineEventHandler, createError } from "h3";
import { db, oidcClients } from "../../../db/index.ts";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as argon2 from "argon2";
import { writeAuditLog, AuditEvents } from "../../../services/audit.ts";
import { getAuthUser } from "../../../utils/auth.ts";
import { isSuperAdmin } from "../../../utils/roles.ts";

/**
 * Custom parseBody to avoid h3 version conflicts
 */
async function parseBody(event: any): Promise<any> {
  const req = event.node?.req || event.req;

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
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

/**
 * Custom getHeader to avoid h3 version conflicts
 */
function getHeader(event: any, name: string): string | undefined {
  const req = event.node?.req || event.req;
  return req.headers[name.toLowerCase()];
}

interface CreateClientBody {
  name: string;
  description?: string;
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
  grantTypes?: string[];
  responseTypes?: string[];
  scopes?: string[];
  tokenEndpointAuthMethod?: string;
  isFirstParty?: boolean;
  siteId?: string; // Optional siteId, superadmin can specify, others auto-set
}

/**
 * Create a new OIDC client
 * POST /api/admin/clients
 *
 * Admin dapat membuat client yang otomatis terkait dengan site mereka
 * Superadmin dapat membuat client untuk site manapun
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event);

  const body = (await parseBody(event)) as CreateClientBody & {
    clientName?: string;
  };

  // Support both 'name' and 'clientName' for backwards compatibility
  const clientName = body.name || body.clientName;

  // Validate required fields
  if (!clientName?.trim()) {
    throw createError({
      statusCode: 400,
      message: "Client name is required",
    });
  }

  if (!body.redirectUris || body.redirectUris.length === 0) {
    throw createError({
      statusCode: 400,
      message: "At least one redirect URI is required",
    });
  }

  // Validate redirect URIs format
  for (const uri of body.redirectUris) {
    try {
      new URL(uri);
    } catch {
      throw createError({
        statusCode: 400,
        message: `Invalid redirect URI: ${uri}`,
      });
    }
  }

  try {
    // Generate client ID and secret
    const clientId = `sso_${uuidv4().replace(/-/g, "").substring(0, 24)}`;
    const clientSecret =
      uuidv4().replace(/-/g, "") + uuidv4().replace(/-/g, "");

    // Hash client secret if confidential client
    const authMethod = body.tokenEndpointAuthMethod || "client_secret_basic";
    const isPublicClient = authMethod === "none";

    let clientSecretHash = null;
    if (!isPublicClient) {
      clientSecretHash = await argon2.hash(clientSecret, {
        type: argon2.argon2id,
      });
    }

    // Determine siteId for this client
    // Superadmin can specify, others use their own siteId
    let clientSiteId: string | null = null;
    if (user) {
      if (isSuperAdmin(user)) {
        clientSiteId = body.siteId || null; // Superadmin can make global clients
      } else if (user.siteId) {
        clientSiteId = user.siteId; // Non-superadmin always uses their site
      }
    }

    // Insert client
    const [newClient] = await db
      .insert(oidcClients)
      .values({
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
        siteId: clientSiteId,
      })
      .returning();

    // Audit log
    await writeAuditLog({
      action: AuditEvents.ADMIN_CLIENT_CREATED,
      // actorUserId: TODO: get from session
      targetType: "oidc_client",
      targetId: newClient.id,
      ip:
        getHeader(event, "x-forwarded-for") ||
        event.node.req.socket.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        clientId,
        name: newClient.name,
      },
    });

    return {
      success: true,
      client: {
        id: newClient.id,
        clientId: newClient.clientId,
        clientSecret: isPublicClient ? null : clientSecret, // Only return once!
        name: newClient.name,
        description: newClient.description,
        redirectUris: newClient.redirectUris,
        postLogoutRedirectUris: newClient.postLogoutRedirectUris,
        grantTypes: newClient.grantTypes,
        responseTypes: newClient.responseTypes,
        scopes: newClient.scopes,
        tokenEndpointAuthMethod: newClient.tokenEndpointAuthMethod,
        isFirstParty: newClient.isFirstParty,
        isActive: newClient.isActive,
      },
      message: isPublicClient
        ? "Client created successfully (public client - no secret)"
        : "Client created successfully. Save the client_secret now - it will not be shown again!",
    };
  } catch (error: any) {
    // Log detailed error for debugging
    console.error("Create client error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    event.context.logger?.error({ error }, "Failed to create client");

    if (error.code === "23505") {
      // Unique violation
      throw createError({
        statusCode: 409,
        message: "Client with this ID already exists",
      });
    }

    throw createError({
      statusCode: 500,
      message: `Failed to create client: ${error.message}`,
    });
  }
});
