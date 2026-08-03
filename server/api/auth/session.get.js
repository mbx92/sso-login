import { defineEventHandler } from "h3";
import { getSessionUser } from "../../utils/session.js";

/**
 * Validate the active session server-side.
 * Returns { valid: true, user } when the sso_session cookie maps to a
 * live Session row in oidc_kv and the user is still active; otherwise
 * { valid: false }. Used by the client middleware so revoked sessions
 * actually lock the user out of the portal.
 */
export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event);
  if (!user) {
    return { valid: false };
  }
  return { valid: true, user };
});
