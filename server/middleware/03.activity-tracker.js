import { db, users } from "../db/index";
import { eq } from "drizzle-orm";
const lastUpdateCache = /* @__PURE__ */ new Map();
const UPDATE_INTERVAL_MS = 60 * 1e3;
var activity_tracker_default = defineEventHandler(async (event) => {
  const path = event.path || "";
  if (!path.startsWith("/api/")) {
    return;
  }
  const skipPaths = [
    "/api/admin/sessions",
    // Don't update activity just from viewing sessions page
    "/api/oidc/authorize",
    "/api/oidc/token",
    "/api/auth/login",
    "/api/auth/logout"
  ];
  if (skipPaths.some((p) => path.startsWith(p))) {
    return;
  }
  const userCookie = event.node?.req.headers.cookie?.split(";").find((c) => c.trim().startsWith("sso_user="))?.split("=")[1];
  if (!userCookie) {
    return;
  }
  let userId = null;
  try {
    const userData = JSON.parse(decodeURIComponent(userCookie));
    userId = userData.userId;
  } catch {
    return;
  }
  if (!userId) {
    return;
  }
  const now = Date.now();
  const lastUpdate = lastUpdateCache.get(userId) || 0;
  if (now - lastUpdate < UPDATE_INTERVAL_MS) {
    return;
  }
  lastUpdateCache.set(userId, now);
  db.update(users).set({ lastActivityAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).catch((error) => {
    console.error("Failed to update user activity:", error);
  });
});
export {
  activity_tracker_default as default
};
