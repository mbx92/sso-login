import { db, oidcKv } from '../../../db/index'
import { eq, and } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../services/audit'

function parseBody(event: any): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    event.node.req.on('data', (chunk: Buffer) => chunks.push(chunk))
    event.node.req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString())
        resolve(body)
      } catch {
        resolve(null)
      }
    })
    event.node.req.on('error', () => resolve(null))
  })
}

/**
 * Revoke a session (delete refresh token)
 * DELETE /api/admin/sessions/[id]
 */
export default defineEventHandler(async (event) => {
  try {
    const sessionId = event.context.params?.id
    
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: 'Session ID is required'
      })
    }

    // Find the session entry
    const [entry] = await db
      .select()
      .from(oidcKv)
      .where(eq(oidcKv.id, sessionId))
      .limit(1)

    if (!entry) {
      throw createError({
        statusCode: 404,
        message: 'Session not found'
      })
    }

    const payload = entry.payload as any
    const userId = payload?.userId || payload?.accountId
    const clientId = payload?.clientId

    // Delete the specific refresh token
    await db
      .delete(oidcKv)
      .where(eq(oidcKv.id, sessionId))

    // If this is a refresh token with a grantId, also delete related tokens
    if (entry.grantId) {
      await db
        .delete(oidcKv)
        .where(eq(oidcKv.grantId, entry.grantId))
    }

    // Delete ALL refresh tokens for this user-client combination
    // This ensures the user cannot use any existing refresh token
    if (userId && clientId) {
      const allUserTokens = await db
        .select()
        .from(oidcKv)
        .where(eq(oidcKv.model, 'RefreshToken'))
      
      // Filter and delete tokens matching user-client
      for (const token of allUserTokens) {
        const tokenPayload = token.payload as any
        if ((tokenPayload?.userId === userId || tokenPayload?.accountId === userId) && 
            tokenPayload?.clientId === clientId) {
          await db.delete(oidcKv).where(eq(oidcKv.id, token.id))
        }
      }
    }

    console.log(`Revoked all sessions for user ${userId} on client ${clientId}`)

    // Log the action
    const forwardedFor = event.node?.req.headers['x-forwarded-for']
    const clientIp = (typeof forwardedFor === 'string' 
      ? forwardedFor.split(',')[0]?.trim() 
      : null) || event.node?.req.socket.remoteAddress || 'unknown'

    // Get admin user from cookie
    const userCookie = event.node.req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('sso_user='))
      ?.split('=')[1]

    let adminUserId = null
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie))
        adminUserId = userData.userId
      } catch {}
    }

    await writeAuditLog({
      action: 'SESSION_REVOKED' as any,
      actorUserId: adminUserId,
      actorType: 'user',
      targetType: 'session',
      targetId: userId,
      ip: clientIp,
      userAgent: (event.node?.req.headers['user-agent'] as string) || 'unknown',
      metadata: {
        sessionId,
        revokedUserId: userId,
        clientId
      }
    })

    return {
      success: true,
      message: 'Session revoked successfully'
    }
  } catch (error: any) {
    console.error('Error revoking session:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to revoke session'
    })
  }
})
