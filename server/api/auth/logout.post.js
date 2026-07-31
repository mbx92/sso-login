import { writeAuditLog, AuditEvents } from "../../services/audit";
var logout_post_default = defineEventHandler(async (event) => {
  try {
    const userCookie = event.node.req.headers.cookie?.split(";").find((c) => c.trim().startsWith("sso_user="))?.split("=")[1];
    let userId = null;
    let email = null;
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        userId = userData.userId;
        email = userData.email;
      } catch (e) {
      }
    }
    deleteCookie(event, "sso_session", { path: "/" });
    deleteCookie(event, "sso_user", { path: "/" });
    if (userId) {
      const forwardedFor = event.node?.req.headers["x-forwarded-for"];
      const clientIp = (typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : null) || event.node?.req.socket.remoteAddress || "unknown";
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGOUT,
        actorUserId: userId,
        actorType: "user",
        targetType: "user",
        targetId: userId,
        ip: clientIp,
        userAgent: event.node?.req.headers["user-agent"] || "unknown",
        requestId: event.context?.requestId,
        metadata: {
          email: email || "unknown"
        }
      });
    }
    return {
      success: true,
      message: "Logged out successfully"
    };
  } catch (error) {
    console.error("Logout error:", error);
    deleteCookie(event, "sso_session", { path: "/" });
    deleteCookie(event, "sso_user", { path: "/" });
    return {
      success: true,
      message: "Logged out"
    };
  }
});
export {
  logout_post_default as default
};
