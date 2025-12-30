import { db, users } from '../db/index.ts'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import { logger } from '../services/logger.ts'
import { writeAuditLog, AuditEvents } from '../services/audit.ts'

export interface LoginResult {
  success: boolean
  userId?: string
  error?: string
}

export interface InteractionDetails {
  uid: string
  prompt: {
    name: string
    details?: Record<string, unknown>
    reasons?: string[]
  }
  params: Record<string, unknown>
  session?: {
    accountId?: string
    uid: string
    cookie: string
  }
}

/**
 * Authenticate user by email/employee_id and password
 */
export async function authenticateUser(
  identifier: string,
  password: string,
  context: {
    ip?: string
    userAgent?: string
    requestId?: string
  }
): Promise<LoginResult> {
  try {
    // Find user by email or employee_id
    const result = await db
      .select()
      .from(users)
      .where(or(
        eq(users.email, identifier.toLowerCase()),
        eq(users.employeeId, identifier)
      ))
      .limit(1)

    if (result.length === 0) {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        targetType: 'user',
        targetId: identifier,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: 'user_not_found' }
      })
      return { success: false, error: 'Invalid credentials' }
    }

    const user = result[0]

    // Check if user is active
    if (user.status !== 'active') {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: 'user_disabled' }
      })
      return { success: false, error: 'Account is disabled' }
    }

    // Check if user has password
    if (!user.passwordHash) {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: 'no_password' }
      })
      return { success: false, error: 'Password not set. Please contact administrator.' }
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, password)

    if (!isValid) {
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGIN_FAILED,
        actorUserId: user.id,
        targetType: 'user',
        targetId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: { reason: 'invalid_password' }
      })
      return { success: false, error: 'Invalid credentials' }
    }

    // Success
    await writeAuditLog({
      action: AuditEvents.AUTH_LOGIN_SUCCESS,
      actorUserId: user.id,
      targetType: 'user',
      targetId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId
    })

    logger.info({ userId: user.id, email: user.email }, 'User authenticated successfully')

    return { success: true, userId: user.id }
  } catch (error) {
    logger.error({ error, identifier }, 'Authentication error')
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Check if consent should be auto-approved (for first-party clients)
 */
export function shouldAutoApproveConsent(clientMetadata: Record<string, unknown>): boolean {
  return clientMetadata['urn:sso:first_party'] === true
}
