import { writeAuditLog, AuditEvents } from "../../services/audit";
import { clearAuthCookies } from "../../utils/auth-cookies.js";

function readSsoUserFromRequest(event) {
  const raw = event.node.req.headers.cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("sso_user="))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export default defineEventHandler(async (event) => {
  try {
    const userData = readSsoUserFromRequest(event);
    const userId = userData?.userId || null;
    const email = userData?.email || null;

    clearAuthCookies(event);

    if (userId) {
      const forwardedFor = event.node?.req.headers["x-forwarded-for"];
      const clientIp =
        (typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : null) ||
        event.node?.req.socket.remoteAddress ||
        "unknown";
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
          email: email || "unknown",
        },
      });
    }

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    console.error("Logout error:", error);
    clearAuthCookies(event);
    return {
      success: true,
      message: "Logged out",
    };
  }
});
