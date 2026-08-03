import { db, oidcKv, users } from "../db/index.js";
import { eq, and, gt } from "drizzle-orm";
import { isAdmin } from "./roles.js";

function readCookie(event, name) {
  const rawCookies = event?.node?.req?.headers?.cookie || "";
  if (!rawCookies) return null;
  const parts = rawCookies.split(";");
  const match = parts.find((c) => c.trim().startsWith(`${name}=`));
  if (!match) return null;
  return match.split("=").slice(1).join("=").trim();
}

/**
 * Resolve the currently logged-in user by validating the server-side
 * `sso_session` cookie against the oidc_kv store. Returns null when the
 * cookie is missing, expired, revoked, or the user is disabled.
 *
 * This is the single source of truth for "is this user logged in?".
 * The legacy `sso_user` cookie is intentionally NOT trusted here — it is
 * only a display cache and must never grant access on its own.
 */
export async function getSessionUser(event) {
  const sessionId = readCookie(event, "sso_session");
  if (!sessionId) return null;

  try {
    const [session] = await db
      .select()
      .from(oidcKv)
      .where(
        and(
          eq(oidcKv.model, "Session"),
          eq(oidcKv.key, sessionId),
          gt(oidcKv.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session?.payload?.userId) return null;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        roleId: users.roleId,
        roleName: users.roleName,
        status: users.status,
        unitId: users.unitId,
      })
      .from(users)
      .where(eq(users.id, session.payload.userId))
      .limit(1);

    if (!user || user.status !== "active") return null;

    return {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      unitId: user.unitId,
      isAdmin: isAdmin(user),
    };
  } catch (error) {
    console.error("Session lookup error:", error.message);
    return null;
  }
}
