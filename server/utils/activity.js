import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";

// Shared by server/middleware/03.activity-tracker.js (direct hits on sso-login
// itself) and server/api/auth/check-session.post.js (polled by client apps via
// @mbx92/nuxt-sso-client) — both feed the same "Online Now" signal, throttled
// to one DB write per user per minute regardless of which caller triggers it.
const lastUpdateCache = new Map();
const UPDATE_INTERVAL_MS = 60 * 1000;

export function touchUserActivity(userId) {
  const now = Date.now();
  const lastUpdate = lastUpdateCache.get(userId) || 0;
  if (now - lastUpdate < UPDATE_INTERVAL_MS) return;
  lastUpdateCache.set(userId, now);
  db.update(users).set({ lastActivityAt: new Date() }).where(eq(users.id, userId)).catch((error) => {
    console.error("Failed to update user activity:", error.message);
  });
}
