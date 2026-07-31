import { defineEventHandler, createError } from "h3";
import { db, oidcClients } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import * as argon2 from "argon2";
import {
  verifyAuthorizationCode,
  verifyRefreshToken,
  createAccessToken,
  createIDToken,
  createRefreshToken
} from "../../services/oidc.js";
import { writeAuditLog, AuditEvents } from "../../services/audit.js";
async function parseBody(event) {
  const req = event.node?.req || event.req;
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        if (body.startsWith("{")) {
          resolve(JSON.parse(body));
        } else {
          const params = new URLSearchParams(body);
          const result = {};
          params.forEach((value, key) => {
            result[key] = value;
          });
          resolve(result);
        }
      } catch (error) {
        reject(new Error("Invalid request body"));
      }
    });
    req.on("error", reject);
  });
}
function getHeader(event, name) {
  const req = event.node?.req || event.req;
  return req.headers[name.toLowerCase()];
}
function parseBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }
  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [username, password] = credentials.split(":");
    return { username, password };
  } catch {
    return null;
  }
}
var token_post_default = defineEventHandler(async (event) => {
  const body = await parseBody(event);
  const authHeader = getHeader(event, "authorization");
  console.log("Token endpoint called with body:", JSON.stringify(body, null, 2));
  console.log("Auth header:", authHeader ? "present" : "not present");
  const grantType = body.grant_type;
  let clientId = body.client_id;
  let clientSecret = body.client_secret;
  if (authHeader) {
    const basicAuth = parseBasicAuth(authHeader);
    if (basicAuth) {
      clientId = basicAuth.username;
      clientSecret = basicAuth.password;
    }
  }
  if (!grantType) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: grant_type"
    });
  }
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: client_id"
    });
  }
  try {
    const [client] = await db.select().from(oidcClients).where(
      and(
        eq(oidcClients.clientId, clientId),
        eq(oidcClients.isActive, true)
      )
    ).limit(1);
    if (!client) {
      console.log("Client not found:", clientId);
      throw createError({
        statusCode: 401,
        message: "Invalid client credentials"
      });
    }
    console.log("Client found:", client.name, "Auth method:", client.tokenEndpointAuthMethod);
    const isPublicClient = client.tokenEndpointAuthMethod === "none";
    console.log("Is public client:", isPublicClient, "Has client secret hash:", !!client.clientSecretHash);
    if (!isPublicClient && client.clientSecretHash) {
      if (!clientSecret) {
        console.log("Client secret required but not provided");
        throw createError({
          statusCode: 401,
          message: "Client authentication required"
        });
      }
      const validSecret = await argon2.verify(client.clientSecretHash, clientSecret);
      if (!validSecret) {
        throw createError({
          statusCode: 401,
          message: "Invalid client credentials"
        });
      }
    }
    if (grantType === "authorization_code") {
      return await handleAuthorizationCodeGrant(event, body, client);
    } else if (grantType === "refresh_token") {
      return await handleRefreshTokenGrant(event, body, client);
    } else {
      throw createError({
        statusCode: 400,
        message: `Unsupported grant_type: ${grantType}`
      });
    }
  } catch (error) {
    console.error("Token endpoint error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Internal server error"
    });
  }
});
async function handleAuthorizationCodeGrant(event, body, client) {
  const code = body.code;
  const redirectUri = body.redirect_uri;
  const codeVerifier = body.code_verifier;
  if (!code) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: code"
    });
  }
  if (!redirectUri) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: redirect_uri"
    });
  }
  const authCode = await verifyAuthorizationCode({
    code,
    clientId: client.clientId,
    redirectUri,
    codeVerifier
  });
  if (!authCode) {
    throw createError({
      statusCode: 400,
      message: "Invalid or expired authorization code"
    });
  }
  const accessToken = await createAccessToken({
    userId: authCode.userId,
    clientId: client.clientId,
    scopes: authCode.scopes
  });
  const idToken = await createIDToken({
    userId: authCode.userId,
    clientId: client.clientId,
    nonce: authCode.nonce
  });
  const refreshToken = await createRefreshToken({
    userId: authCode.userId,
    clientId: client.clientId,
    scopes: authCode.scopes
  });
  await writeAuditLog({
    action: AuditEvents.OIDC_TOKEN_ISSUED,
    actorUserId: authCode.userId,
    targetType: "oidc_client",
    targetId: client.id,
    ip: getHeader(event, "x-forwarded-for") || event.node?.req?.socket?.remoteAddress,
    userAgent: getHeader(event, "user-agent"),
    requestId: event.context.requestId,
    metadata: {
      clientId: client.clientId,
      grantType: "authorization_code",
      scopes: authCode.scopes
    }
  });
  return {
    access_token: accessToken.token,
    token_type: "Bearer",
    expires_in: accessToken.expiresIn,
    refresh_token: refreshToken.token,
    id_token: idToken.token,
    scope: authCode.scopes.join(" ")
  };
}
async function handleRefreshTokenGrant(event, body, client) {
  const refreshTokenValue = body.refresh_token;
  if (!refreshTokenValue) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: refresh_token"
    });
  }
  const tokenData = await verifyRefreshToken({
    token: refreshTokenValue,
    clientId: client.clientId
  });
  if (!tokenData) {
    throw createError({
      statusCode: 400,
      message: "Invalid or expired refresh token"
    });
  }
  const accessToken = await createAccessToken({
    userId: tokenData.userId,
    clientId: client.clientId,
    scopes: tokenData.scopes
  });
  const newRefreshToken = await createRefreshToken({
    userId: tokenData.userId,
    clientId: client.clientId,
    scopes: tokenData.scopes
  });
  await writeAuditLog({
    action: AuditEvents.OIDC_TOKEN_REFRESHED,
    actorUserId: tokenData.userId,
    targetType: "oidc_client",
    targetId: client.id,
    ip: getHeader(event, "x-forwarded-for") || event.node?.req?.socket?.remoteAddress,
    userAgent: getHeader(event, "user-agent"),
    requestId: event.context.requestId,
    metadata: {
      clientId: client.clientId,
      grantType: "refresh_token"
    }
  });
  return {
    access_token: accessToken.token,
    token_type: "Bearer",
    expires_in: accessToken.expiresIn,
    refresh_token: newRefreshToken.token,
    scope: tokenData.scopes.join(" ")
  };
}
export {
  token_post_default as default
};
