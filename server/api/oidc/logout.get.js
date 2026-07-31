import { defineEventHandler } from "h3";
import { writeAuditLog, AuditEvents } from "../../services/audit.js";
import { serialize } from "cookie";
import { shouldUseSecureCookies } from "../../utils/cookie";
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
  const sessionCookie = cookies.split(";").find((c) => c.trim().startsWith("sso_session="));
  if (!sessionCookie) return null;
  const sessionId = sessionCookie.split("=")[1];
  try {
    const decoded = Buffer.from(sessionId, "base64").toString("utf-8");
    const session = JSON.parse(decoded);
    return session.userId;
  } catch {
    return null;
  }
}
function setNativeCookie(event, name, value, options = {}) {
  const res = event.node?.res || event.res;
  const cookieStr = serialize(name, value, {
    httpOnly: options.httpOnly !== false,
    secure: options.secure || false,
    sameSite: options.sameSite || "lax",
    path: options.path || "/",
    maxAge: options.maxAge,
    ...options
  });
  const existing = res.getHeader("Set-Cookie") || [];
  const cookies = Array.isArray(existing) ? existing : [existing];
  cookies.push(cookieStr);
  res.setHeader("Set-Cookie", cookies);
}
var logout_get_default = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const idTokenHint = query.id_token_hint;
  const postLogoutRedirectUri = query.post_logout_redirect_uri;
  const state = query.state;
  const userId = getSessionUserId(event);
  setNativeCookie(event, "sso_session", "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 0
    // Delete cookie
  });
  setNativeCookie(event, "sso_user", "", {
    httpOnly: false,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 0
    // Delete cookie
  });
  if (userId) {
    await writeAuditLog({
      action: AuditEvents.USER_LOGOUT,
      actorUserId: userId,
      ip: getHeader(event, "x-forwarded-for") || event.node?.req?.socket?.remoteAddress,
      userAgent: getHeader(event, "user-agent"),
      requestId: event.context.requestId,
      metadata: {
        viaOIDC: true
      }
    });
  }
  if (postLogoutRedirectUri) {
    const redirectUrl = new URL(postLogoutRedirectUri);
    if (state) {
      redirectUrl.searchParams.set("state", state);
    }
    doRedirect(event, redirectUrl.toString());
    return;
  }
  doRedirect(event, "/");
});
export {
  logout_get_default as default
};
