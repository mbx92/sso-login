import { defineEventHandler } from "h3";
import { eq } from "drizzle-orm";
import { writeAuditLog, AuditEvents } from "../../services/audit.js";
import { clearAuthCookies } from "../../utils/auth-cookies.js";
import { db, oidcClients } from "../../db/index.js";

function doRedirect(event, url, statusCode = 302) {
  const res = event.node?.res || event.res;
  res.statusCode = statusCode;
  res.setHeader("Location", url);
  res.end();
}

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

function getSessionUserId(event) {
  const cookies = getHeader(event, "cookie");
  if (!cookies) return null;
  const userCookie = cookies.split(";").find((c) => c.trim().startsWith("sso_user="));
  if (userCookie) {
    try {
      const raw = userCookie.split("=").slice(1).join("=");
      const user = JSON.parse(decodeURIComponent(raw));
      return user.userId || null;
    } catch {
      // fall through
    }
  }
  return null;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const postLogoutRedirectUri = query.post_logout_redirect_uri;
  const clientId = query.client_id;
  const state = query.state;
  const userId = getSessionUserId(event);

  clearAuthCookies(event);

  if (userId) {
    await writeAuditLog({
      action: AuditEvents.AUTH_LOGOUT,
      actorUserId: userId,
      ip: getHeader(event, "x-forwarded-for") || event.node?.req?.socket?.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        viaOIDC: true,
      },
    });
  }

  // post_logout_redirect_uri must be validated against the client's
  // registered post_logout_redirect_uris — same rule as authorize's
  // redirect_uri check — otherwise this endpoint is an open redirect
  // (anyone can craft a logout link that lands the user anywhere).
  if (postLogoutRedirectUri && clientId) {
    try {
      const [client] = await db
        .select()
        .from(oidcClients)
        .where(eq(oidcClients.clientId, clientId))
        .limit(1);
      const allowed = client?.postLogoutRedirectUris || [];
      if (allowed.includes(postLogoutRedirectUri)) {
        const redirectUrl = new URL(postLogoutRedirectUri);
        if (state) redirectUrl.searchParams.set("state", state);
        doRedirect(event, redirectUrl.toString());
        return;
      }
      console.warn(
        `[oidc/logout] rejected unregistered post_logout_redirect_uri "${postLogoutRedirectUri}" for client "${clientId}"`
      );
    } catch (error) {
      console.error("[oidc/logout] post_logout_redirect_uri validation error:", error);
    }
  }
  doRedirect(event, "/login");
});
