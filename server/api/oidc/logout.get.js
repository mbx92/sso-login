import { defineEventHandler } from "h3";
import { writeAuditLog, AuditEvents } from "../../services/audit.js";
import { clearAuthCookies } from "../../utils/auth-cookies.js";

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

  if (postLogoutRedirectUri) {
    try {
      const redirectUrl = new URL(postLogoutRedirectUri);
      if (state) redirectUrl.searchParams.set("state", state);
      doRedirect(event, redirectUrl.toString());
      return;
    } catch {
      // invalid redirect — fall back
    }
  }
  doRedirect(event, "/login");
});
