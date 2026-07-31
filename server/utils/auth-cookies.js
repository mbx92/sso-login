import { serialize } from "cookie";
import { shouldUseSecureCookies } from "./cookie.js";

function appendSetCookie(event, cookieStr) {
  const res = event.node?.res || event.res;
  const existing = res.getHeader("Set-Cookie") || [];
  const cookies = Array.isArray(existing) ? existing : [existing].filter(Boolean);
  cookies.push(cookieStr);
  res.setHeader("Set-Cookie", cookies);
}

/**
 * Clear SSO auth cookies with the same attributes used at login,
 * otherwise browsers keep the original cookie.
 */
export function clearAuthCookies(event) {
  const secure = shouldUseSecureCookies();
  const common = {
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 0,
    expires: new Date(0),
  };

  appendSetCookie(
    event,
    serialize("sso_session", "", {
      ...common,
      httpOnly: true,
    }),
  );
  appendSetCookie(
    event,
    serialize("sso_user", "", {
      ...common,
      httpOnly: false,
    }),
  );
}

export function setAuthCookie(event, name, value, options = {}) {
  const secure = shouldUseSecureCookies();
  appendSetCookie(
    event,
    serialize(name, value, {
      path: "/",
      sameSite: "lax",
      secure,
      httpOnly: options.httpOnly ?? true,
      maxAge: options.maxAge,
      ...options,
    }),
  );
}
