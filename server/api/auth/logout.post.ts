import { writeAuditLog, AuditEvents } from '../../services/audit'

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
export default defineEventHandler(async (event) => {
  try {
    // Get user from cookie
    const userCookie = event.node.req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('sso_user='))
      ?.split('=')[1]

    let userId = null
    let email = null

    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie))
        userId = userData.userId
        email = userData.email
      } catch (e) {
        // Invalid cookie, ignore
      }
    }

    // Delete session cookies
    deleteCookie(event, 'sso_session', { path: '/' })
    deleteCookie(event, 'sso_user', { path: '/' })

    // Log logout
    if (userId) {
      const forwardedFor = event.node?.req.headers['x-forwarded-for']
      const clientIp = (typeof forwardedFor === 'string' 
        ? forwardedFor.split(',')[0]?.trim() 
        : null) || event.node?.req.socket.remoteAddress || 'unknown'
      
      await writeAuditLog({
        action: AuditEvents.AUTH_LOGOUT,
        actorUserId: userId,
        actorType: 'user',
        targetType: 'user',
        targetId: userId,
        ip: clientIp,
        userAgent: (event.node?.req.headers['user-agent'] as string) || 'unknown',
        requestId: event.context?.requestId,
        metadata: {
          email: email || 'unknown'
        }
      })
    }

    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error) {
    console.error('Logout error:', error)
    
    // Still delete cookies even on error
    deleteCookie(event, 'sso_session', { path: '/' })
    deleteCookie(event, 'sso_user', { path: '/' })

    return {
      success: true,
      message: 'Logged out'
    }
  }
})
