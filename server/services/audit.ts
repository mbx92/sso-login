import { db, auditLogs, type NewAuditLog } from '../db/index.ts'
import { logger } from './logger'

// Audit event types
export const AuditEvents = {
  // Authentication
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  USER_LOGOUT: 'USER_LOGOUT',
  AUTH_PASSWORD_RESET_REQUESTED: 'AUTH_PASSWORD_RESET_REQUESTED',
  AUTH_PASSWORD_RESET_COMPLETED: 'AUTH_PASSWORD_RESET_COMPLETED',
  
  // OIDC
  OIDC_AUTHORIZE: 'OIDC_AUTHORIZE',
  OIDC_AUTHORIZE_SUCCESS: 'OIDC_AUTHORIZE_SUCCESS',
  OIDC_AUTHORIZE_FAILED: 'OIDC_AUTHORIZE_FAILED',
  OIDC_AUTHORIZE_DENIED: 'OIDC_AUTHORIZE_DENIED',
  OIDC_TOKEN_ISSUED: 'OIDC_TOKEN_ISSUED',
  OIDC_TOKEN_REFRESHED: 'OIDC_TOKEN_REFRESHED',
  OIDC_TOKEN_FAILED: 'OIDC_TOKEN_FAILED',
  OIDC_TOKEN_REVOKED: 'OIDC_TOKEN_REVOKED',
  OIDC_LOGOUT: 'OIDC_LOGOUT',
  OIDC_CONSENT_GRANTED: 'OIDC_CONSENT_GRANTED',
  OIDC_CONSENT_DENIED: 'OIDC_CONSENT_DENIED',
  
  // Admin - Clients
  ADMIN_CLIENT_CREATED: 'ADMIN_CLIENT_CREATED',
  ADMIN_CLIENT_UPDATED: 'ADMIN_CLIENT_UPDATED',
  ADMIN_CLIENT_DELETED: 'ADMIN_CLIENT_DELETED',
  
  // Admin - Users
  ADMIN_USER_CREATED: 'ADMIN_USER_CREATED',
  ADMIN_USER_UPDATED: 'ADMIN_USER_UPDATED',
  ADMIN_USER_DISABLED: 'ADMIN_USER_DISABLED',
  ADMIN_USER_ENABLED: 'ADMIN_USER_ENABLED',
  
  // Admin - Roles
  ADMIN_ROLE_CREATED: 'ADMIN_ROLE_CREATED',
  ADMIN_ROLE_UPDATED: 'ADMIN_ROLE_UPDATED',
  ADMIN_ROLE_DELETED: 'ADMIN_ROLE_DELETED',
  ADMIN_USER_ROLE_ASSIGNED: 'ADMIN_USER_ROLE_ASSIGNED',
  ADMIN_USER_ROLE_REMOVED: 'ADMIN_USER_ROLE_REMOVED',
  
  // HRIS Sync
  HRIS_SYNC_STARTED: 'HRIS_SYNC_STARTED',
  HRIS_SYNC_COMPLETED: 'HRIS_SYNC_COMPLETED',
  HRIS_SYNC_FAILED: 'HRIS_SYNC_FAILED'
} as const

export type AuditEventType = typeof AuditEvents[keyof typeof AuditEvents]

export interface AuditLogParams {
  action: AuditEventType
  actorUserId?: string
  actorType?: 'user' | 'system'
  targetType?: string
  targetId?: string
  ip?: string
  userAgent?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

/**
 * Write an audit log entry to the database
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  const {
    action,
    actorUserId,
    actorType = actorUserId ? 'user' : 'system',
    targetType,
    targetId,
    ip,
    userAgent,
    requestId,
    metadata = {}
  } = params

  try {
    const logEntry: NewAuditLog = {
      action,
      actorUserId,
      actorType,
      targetType,
      targetId,
      ip,
      userAgent,
      requestId,
      metadata
    }

    await db.insert(auditLogs).values(logEntry)

    logger.debug({
      action,
      actorUserId,
      actorType,
      targetType,
      targetId,
      requestId
    }, 'Audit log written')
  } catch (error) {
    // Log but don't throw - audit logging should not break the main flow
    logger.error({ error, action, requestId }, 'Failed to write audit log')
  }
}

/**
 * Create an audit logger bound to a request context
 */
export function createAuditLogger(requestContext: {
  requestId: string
  ip?: string
  userAgent?: string
  actorUserId?: string
}) {
  return {
    log: (params: Omit<AuditLogParams, 'requestId' | 'ip' | 'userAgent'>) =>
      writeAuditLog({
        ...params,
        requestId: requestContext.requestId,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent,
        actorUserId: params.actorUserId ?? requestContext.actorUserId
      })
  }
}

/**
 * Simple audit log creation (alias for easier use)
 */
export async function createAuditLog(params: {
  userId: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, unknown>
  ipAddress: string
  userAgent: string
}): Promise<void> {
  await writeAuditLog({
    action: params.action as AuditEventType,
    actorUserId: params.userId === 'system' ? undefined : params.userId,
    actorType: params.userId === 'system' ? 'system' : 'user',
    targetType: params.resource,
    targetId: params.resourceId,
    ip: params.ipAddress,
    userAgent: params.userAgent,
    metadata: params.details
  })
}
