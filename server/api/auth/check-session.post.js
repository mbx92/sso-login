import { defineEventHandler, readBody, createError } from "h3";
import { db, oidcKv } from "../../db/index.js";
import { eq, gt, sql } from "drizzle-orm";

/**
 * Validate that a user still has active SSO sessions.
 * Called by client apps to detect revoked sessions.
 *
 * POST /api/auth/check-session
 * Body: { userId: string }
 * Response: { valid: boolean }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userId = body?.userId;

  if (!userId || typeof userId !== "string") {
    throw createError({ statusCode: 400, message: "userId is required" });
  }

  try {
    // Check if this user has ANY active AccessToken rows in oidc_kv.
    // When admin revokes a session, ALL token rows for the user are deleted
    // (see server/api/admin/sessions/[id].delete.js).
    const [entry] = await db
      .select({ id: oidcKv.id })
      .from(oidcKv)
      .where(
        sql`${oidcKv.model} = 'AccessToken' AND ${oidcKv.payload}->>'accountId' = ${userId} AND ${oidcKv.expiresAt} > NOW()`
      )
      .limit(1);

    return { valid: !!entry };
  } catch (error) {
    console.error("Session check error:", error.message);
    return { valid: false };
  }
});
