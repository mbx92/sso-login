import { defineEventHandler, createError, sendRedirect } from "h3";
import { db, oidcClients, users } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { createAuthorizationCode } from "../../services/oidc.js";
import { writeAuditLog, AuditEvents } from "../../services/audit.js";
import { checkUserClientAccess } from "../../utils/access-control.js";
import { getSessionUser } from "../../utils/session.js";
function getQuery(event) {
  const req = event.node?.req || event.req;
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
function getHeader(event, name) {
  const req = event.node?.req || event.req;
  return req.headers[name.toLowerCase()];
}
function doRedirect(event, url, statusCode = 302) {
  const res = event.node?.res || event.res;
  res.statusCode = statusCode;
  res.setHeader("Location", url);
  res.setHeader("Content-Type", "text/html");
  res.end(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url}"></head><body>Redirecting to <a href="${url}">${url}</a></body></html>`);
}

/**
 * Get authenticated user ID from SSO session.
 * Only the server-side `sso_session` cookie + DB store is trusted.
 * The legacy `sso_user` cookie is a display cache and NEVER grants access,
 * so a revoked session cannot be bypassed with a stale cookie.
 */
async function getUserIdFromSession(event) {
  const sessionUser = await getSessionUser(event);
  if (!sessionUser) {
    console.log('[authorize] no valid server-side session found');
    return null;
  }
  console.log('[authorize] session found via sso_session:', sessionUser.email || sessionUser.userId);
  return sessionUser.userId;
}
var authorize_get_default = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const clientId = query.client_id;
  const redirectUri = query.redirect_uri;
  const responseType = query.response_type || "code";
  const scope = query.scope || "openid";
  const state = query.state;
  const nonce = query.nonce;
  const codeChallenge = query.code_challenge;
  const codeChallengeMethod = query.code_challenge_method;
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: client_id"
    });
  }
  if (!redirectUri) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: redirect_uri"
    });
  }
  if (!state) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameter: state (required for CSRF protection)"
    });
  }
  if (responseType !== "code") {
    return sendRedirect(event, buildErrorRedirect(redirectUri, "unsupported_response_type", "Only response_type=code is supported", state));
  }
  try {
    const [client] = await db.select().from(oidcClients).where(
      and(
        eq(oidcClients.clientId, clientId),
        eq(oidcClients.isActive, true)
      )
    ).limit(1);
    if (!client) {
      throw createError({
        statusCode: 404,
        message: "Client not found or inactive"
      });
    }
    if (!client.redirectUris.includes(redirectUri)) {
      throw createError({
        statusCode: 400,
        message: "Invalid redirect_uri. Must be registered with the client."
      });
    }
    const requestedScopes = scope.split(" ");
    const invalidScopes = requestedScopes.filter((s) => !client.scopes.includes(s));
    if (invalidScopes.length > 0) {
      doRedirect(event, buildErrorRedirect(redirectUri, "invalid_scope", `Invalid scopes: ${invalidScopes.join(", ")}`, state));
      return;
    }
    const userId = await getUserIdFromSession(event);
    if (!userId) {
      let loginUrl = `/login?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
      if (nonce) loginUrl += `&nonce=${encodeURIComponent(nonce)}`;
      if (codeChallenge) loginUrl += `&code_challenge=${encodeURIComponent(codeChallenge)}`;
      if (codeChallengeMethod) loginUrl += `&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`;
      doRedirect(event, loginUrl);
      return;
    }
    const [user] = await db.select().from(users).where(
      and(
        eq(users.id, userId),
        eq(users.status, "active")
      )
    ).limit(1);
    if (!user) {
      doRedirect(event, "/login?error=user_not_found");
      return;
    }
    if (client.requireAccessGrant) {
      const hasAccess = await checkUserClientAccess(user.id, client.id);
      if (!hasAccess) {
        await writeAuditLog({
          action: AuditEvents.OIDC_AUTHORIZE_DENIED,
          actorUserId: user.id,
          targetType: "oidc_client",
          targetId: client.id,
          ip: getHeader(event, "x-forwarded-for") || event.node?.req?.socket?.remoteAddress,
          userAgent: getHeader(event, "user-agent"),
          metadata: {
            reason: "no_access_grant",
            clientName: client.name
          }
        });
        doRedirect(event, `/access-denied?client_name=${encodeURIComponent(client.name)}&client_id=${encodeURIComponent(clientId)}`);
        return;
      }
    }
    const skipConsent = client.isFirstParty;
    if (!skipConsent) {
    }
    const code = await createAuthorizationCode({
      clientId: client.clientId,
      userId: user.id,
      redirectUri,
      scopes: requestedScopes,
      nonce,
      codeChallenge,
      codeChallengeMethod
    });
    await writeAuditLog({
      action: AuditEvents.OIDC_AUTHORIZE,
      actorUserId: user.id,
      targetType: "oidc_client",
      targetId: client.id,
      ip: getHeader(event, "x-forwarded-for") || event.node?.req?.socket?.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        clientId: client.clientId,
        clientName: client.name,
        scopes: requestedScopes,
        hasPKCE: !!codeChallenge
      }
    });
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set("code", code);
    redirectUrl.searchParams.set("state", state);
    doRedirect(event, redirectUrl.toString());
    return;
  } catch (error) {
    console.error("Authorization error:", error);
    if (redirectUri) {
      doRedirect(event, buildErrorRedirect(
        redirectUri,
        "server_error",
        error.message || "Internal server error",
        state
      ));
      return;
    }
    throw error;
  }
});
function buildErrorRedirect(redirectUri, error, description, state) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}
export {
  authorize_get_default as default
};
