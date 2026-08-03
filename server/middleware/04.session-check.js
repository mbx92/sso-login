import { createError } from "h3";
import { getSessionUser } from "../utils/session.js";

const PROTECTED_PREFIXES = ["/api/admin/", "/api/me/"];

/**
 * Gatekeeper for protected APIs. The server-side session (sso_session →
 * oidc_kv) is the single source of truth: a revoked/expired session is
 * rejected here even if a stale `sso_user` cookie is still present.
 * Public flows (/api/oidc, /api/auth/*) are deliberately excluded.
 */
var session_check_default = defineEventHandler(async (event) => {
  const path = event.path || "";
  if (!PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return;
  }

  const user = await getSessionUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  event.context.authUser = user;
});

export { session_check_default as default };
