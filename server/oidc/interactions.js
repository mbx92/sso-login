import { db, users } from "../db/index.js";
import { eq, or } from "drizzle-orm";
import * as argon2 from "argon2";
import { logger } from "../services/logger.js";
import { writeAuditLog, AuditEvents } from "../services/audit.js";
async function authenticateUser(identifier, password, context) {
  try {
    const result = await db.select().from(users).where(or(
      eq(users.email, identifier.toLowerCase()),
      eq(users.employeeId, identifier)
    )).limit(1);
    if (result.length === 0) {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        targetType: "user",
        targetId: identifier,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: "user_not_found" }
      });
      return { success: false, error: "Invalid credentials" };
    }
    const user = result[0];
    if (user.status !== "active") {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        targetType: "user",
        targetId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: "user_disabled" }
      });
      return { success: false, error: "Account is disabled" };
    }
    if (!user.passwordHash) {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        targetType: "user",
        targetId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: "no_password" }
      });
      return { success: false, error: "Password not set. Please contact administrator." };
    }
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        targetType: "user",
        targetId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: "invalid_password" }
      });
      return { success: false, error: "Invalid credentials" };
    }
    await writeAuditLog({
      action: AuditEvents.AUTH_LOGIN_SUCCESS,
      actorUserId: user.id,
      targetType: "user",
      targetId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId
    });
    logger.info({ userId: user.id, email: user.email }, "User authenticated successfully");
    return { success: true, userId: user.id };
  } catch (error) {
    logger.error({ error, identifier }, "Authentication error");
    return { success: false, error: "Authentication failed" };
  }
}
function shouldAutoApproveConsent(clientMetadata) {
  return clientMetadata["urn:sso:first_party"] === true;
}
export {
  authenticateUser,
  shouldAutoApproveConsent
};
