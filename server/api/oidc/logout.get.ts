import { defineEventHandler } from 'h3'
import { db, oidcClients } from '../../db/index.ts'
import { eq } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../services/audit.ts'
import { serialize } from 'cookie'

/**
 * Custom redirect using native Node.js response
 */
function doRedirect(event: any, url: string, statusCode: number = 302): void {
  const res = event.node?.res || event.res
  res.statusCode = statusCode
  res.setHeader('Location', url)
  res.end()
}

/**
 * Custom getQuery function
 */
function getQuery(event: any): Record<string, string> {
  const req = event.node?.req || event.req
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Custom getHeader function
 */
function getHeader(event: any, name: string): string | undefined {
  const req = event.node?.req || event.req
  return req.headers[name.toLowerCase()]
}

/**
 * Get session user ID from cookie
 */
function getSessionUserId(event: any): string | null {
  const cookies = getHeader(event, 'cookie')
  if (!cookies) return null

  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('sso_session='))
  if (!sessionCookie) return null

  const sessionId = sessionCookie.split('=')[1]
  try {
    const decoded = Buffer.from(sessionId, 'base64').toString('utf-8')
    const session = JSON.parse(decoded)
    return session.userId
  } catch {
    return null
  }
}

/**
 * Custom setNativeCookie function
 */
function setNativeCookie(event: any, name: string, value: string, options: any = {}) {
  const res = event.node?.res || event.res
  
  const cookieStr = serialize(name, value, {
    httpOnly: options.httpOnly !== false,
    secure: options.secure || false,
    sameSite: options.sameSite || 'lax',
    path: options.path || '/',
    maxAge: options.maxAge,
    ...options
  })
  
  const existing = res.getHeader('Set-Cookie') || []
  const cookies = Array.isArray(existing) ? existing : [existing]
  cookies.push(cookieStr)
  res.setHeader('Set-Cookie', cookies)
}

/**
 * OIDC Logout Endpoint
 * GET /api/oidc/logout
 * 
 * Handles end-session (logout) requests
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const idTokenHint = query.id_token_hint
  const postLogoutRedirectUri = query.post_logout_redirect_uri
  const state = query.state

  const userId = getSessionUserId(event)

  // Clear SSO session cookie
  setNativeCookie(event, 'sso_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Delete cookie
  })

  // Clear sso_user cookie too
  setNativeCookie(event, 'sso_user', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Delete cookie
  })

  // Audit log if user was logged in
  if (userId) {
    await writeAuditLog({
      action: AuditEvents.USER_LOGOUT,
      actorUserId: userId,
      ip: getHeader(event, 'x-forwarded-for') || event.node?.req?.socket?.remoteAddress,
      userAgent: getHeader(event, 'user-agent'),
      requestId: event.context.requestId,
      metadata: {
        viaOIDC: true
      }
    })
  }

  // If post_logout_redirect_uri provided, validate and redirect
  if (postLogoutRedirectUri) {
    // TODO: Validate post_logout_redirect_uri against registered URIs
    // For now, allow any redirect (be careful in production!)
    
    const redirectUrl = new URL(postLogoutRedirectUri)
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }

    doRedirect(event, redirectUrl.toString())
    return
  }

  // Default: redirect to home
  doRedirect(event, '/')
})
