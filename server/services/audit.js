import { db, auditLogs } from "../db/index.js";
import { logger } from "./logger";
const AuditEvents = {
  // Authentication
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  USER_LOGOUT: "USER_LOGOUT",
  AUTH_PASSWORD_RESET_REQUESTED: "AUTH_PASSWORD_RESET_REQUESTED",
  AUTH_PASSWORD_RESET_COMPLETED: "AUTH_PASSWORD_RESET_COMPLETED",
  // OIDC
  OIDC_AUTHORIZE: "OIDC_AUTHORIZE",
  OIDC_AUTHORIZE_SUCCESS: "OIDC_AUTHORIZE_SUCCESS",
  OIDC_AUTHORIZE_FAILED: "OIDC_AUTHORIZE_FAILED",
  OIDC_AUTHORIZE_DENIED: "OIDC_AUTHORIZE_DENIED",
  OIDC_TOKEN_ISSUED: "OIDC_TOKEN_ISSUED",
  OIDC_TOKEN_REFRESHED: "OIDC_TOKEN_REFRESHED",
  OIDC_TOKEN_FAILED: "OIDC_TOKEN_FAILED",
  OIDC_TOKEN_REVOKED: "OIDC_TOKEN_REVOKED",
  OIDC_LOGOUT: "OIDC_LOGOUT",
  OIDC_CONSENT_GRANTED: "OIDC_CONSENT_GRANTED",
  OIDC_CONSENT_DENIED: "OIDC_CONSENT_DENIED",
  // Admin - Clients
  ADMIN_CLIENT_CREATED: "ADMIN_CLIENT_CREATED",
  ADMIN_CLIENT_UPDATED: "ADMIN_CLIENT_UPDATED",
  ADMIN_CLIENT_DELETED: "ADMIN_CLIENT_DELETED",
  CLIENT_ACCESS_CONTROL_UPDATED: "CLIENT_ACCESS_CONTROL_UPDATED",
  // Admin - Users
  ADMIN_USER_CREATED: "ADMIN_USER_CREATED",
  ADMIN_USER_UPDATED: "ADMIN_USER_UPDATED",
  ADMIN_USER_DISABLED: "ADMIN_USER_DISABLED",
  ADMIN_USER_ENABLED: "ADMIN_USER_ENABLED",
  // Admin - Roles
  ADMIN_ROLE_CREATED: "ADMIN_ROLE_CREATED",
  ADMIN_ROLE_UPDATED: "ADMIN_ROLE_UPDATED",
  ADMIN_ROLE_DELETED: "ADMIN_ROLE_DELETED",
  ADMIN_USER_ROLE_ASSIGNED: "ADMIN_USER_ROLE_ASSIGNED",
  ADMIN_USER_ROLE_REMOVED: "ADMIN_USER_ROLE_REMOVED",
  // HRIS Sync
  HRIS_SYNC_STARTED: "HRIS_SYNC_STARTED",
  HRIS_SYNC_COMPLETED: "HRIS_SYNC_COMPLETED",
  HRIS_SYNC_FAILED: "HRIS_SYNC_FAILED"
};
async function writeAuditLog(params) {
  const {
    action,
    actorUserId,
    actorType = actorUserId ? "user" : "system",
    targetType,
    targetId,
    ip,
    userAgent,
    requestId,
    metadata = {}
  } = params;
  try {
    const logEntry = {
      action,
      actorUserId,
      actorType,
      targetType,
      targetId,
      ip,
      userAgent,
      requestId,
      metadata
    };
    await db.insert(auditLogs).values(logEntry);
    logger.debug({
      action,
      actorUserId,
      actorType,
      targetType,
      targetId,
      requestId
    }, "Audit log written");
  } catch (error) {
    logger.error({ error, action, requestId }, "Failed to write audit log");
  }
}
function createAuditLogger(requestContext) {
  return {
    log: (params) => writeAuditLog({
      ...params,
      requestId: requestContext.requestId,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      actorUserId: params.actorUserId ?? requestContext.actorUserId
    })
  };
}
async function createAuditLog(params) {
  await writeAuditLog({
    action: params.action,
    actorUserId: params.userId === "system" ? void 0 : params.userId,
    actorType: params.userId === "system" ? "system" : "user",
    targetType: params.resource,
    targetId: params.resourceId,
    ip: params.ipAddress,
    userAgent: params.userAgent,
    metadata: params.details
  });
}
export {
  AuditEvents,
  createAuditLog,
  createAuditLogger,
  writeAuditLog
};
