import { touchUserActivity } from "../utils/activity.js";
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
  touchUserActivity(userId);
});
export {
  activity_tracker_default as default
};
