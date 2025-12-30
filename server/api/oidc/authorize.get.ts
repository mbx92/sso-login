import { defineEventHandler, createError } from 'h3'
import { db, oidcClients, users, userAppAccess } from '../../db/index.ts'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { createAuthorizationCode } from '../../services/oidc.ts'
import { writeAuditLog, AuditEvents } from '../../services/audit.ts'

/**
 * Custom getQuery to avoid h3 version conflicts
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
 * Custom redirect using native Node.js response
 */
function doRedirect(event: any, url: string, statusCode: number = 302): void {
  const res = event.node?.res || event.res
  res.statusCode = statusCode
  res.setHeader('Location', url)
  res.setHeader('Content-Type', 'text/html')
  res.end(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url}"></head><body>Redirecting to <a href="${url}">${url}</a></body></html>`)
}

/**
 * Get session user ID from cookie
 */
function getSessionUserId(event: any): string | null {
  const cookies = getHeader(event, 'cookie')
  if (!cookies) return null

  // Parse sso_user cookie which contains user data
  const userCookie = cookies.split(';').find(c => c.trim().startsWith('sso_user='))
  if (!userCookie) return null

  try {
    const userDataStr = decodeURIComponent(userCookie.split('=')[1])
    const userData = JSON.parse(userDataStr)
    return userData.userId
  } catch (error) {
    console.error('Failed to parse sso_user cookie:', error)
    return null
  }
}

/**
 * OIDC Authorization Endpoint
 * GET /api/oidc/authorize
 * 
 * Handles OAuth 2.0 / OIDC authorization requests
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Required parameters
  const clientId = query.client_id
  const redirectUri = query.redirect_uri
  const responseType = query.response_type || 'code'
  const scope = query.scope || 'openid'
  const state = query.state
  const nonce = query.nonce
  const codeChallenge = query.code_challenge
  const codeChallengeMethod = query.code_challenge_method

  // Validate required parameters
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: client_id'
    })
  }

  if (!redirectUri) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: redirect_uri'
    })
  }

  if (!state) {
    throw createError({
      statusCode: 400,
      message: 'Missing required parameter: state (required for CSRF protection)'
    })
  }

  // Only support authorization code flow
  if (responseType !== 'code') {
    return sendRedirect(event, buildErrorRedirect(redirectUri, 'unsupported_response_type', 'Only response_type=code is supported', state))
  }

  try {
    // Find and validate client
    const [client] = await db
      .select()
      .from(oidcClients)
      .where(
        and(
          eq(oidcClients.clientId, clientId),
          eq(oidcClients.isActive, true)
        )
      )
      .limit(1)

    if (!client) {
      throw createError({
        statusCode: 404,
        message: 'Client not found or inactive'
      })
    }

    // Validate redirect_uri
    if (!client.redirectUris.includes(redirectUri)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid redirect_uri. Must be registered with the client.'
      })
    }

    // Validate scopes
    const requestedScopes = scope.split(' ')
    const invalidScopes = requestedScopes.filter(s => !client.scopes.includes(s))
    if (invalidScopes.length > 0) {
      doRedirect(event, buildErrorRedirect(redirectUri, 'invalid_scope', `Invalid scopes: ${invalidScopes.join(', ')}`, state))
      return
    }

    // Check if user is logged in
    const userId = getSessionUserId(event)

    if (!userId) {
      // Not logged in - redirect to login with return URL
      let loginUrl = `/login?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`
      if (nonce) loginUrl += `&nonce=${encodeURIComponent(nonce)}`
      if (codeChallenge) loginUrl += `&code_challenge=${encodeURIComponent(codeChallenge)}`
      if (codeChallengeMethod) loginUrl += `&code_challenge_method=${encodeURIComponent(codeChallengeMethod)}`
      
      doRedirect(event, loginUrl)
      return
    }

    // Verify user exists and is active
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.status, 'active')
        )
      )
      .limit(1)

    if (!user) {
      // User not found or inactive - force re-login
      doRedirect(event, '/login?error=user_not_found')
      return
    }

    // Check if app requires explicit access grant
    if (client.requireAccessGrant) {
      // Check if user has been granted access to this app
      const now = new Date()
      const [accessGrant] = await db
        .select()
        .from(userAppAccess)
        .where(
          and(
            eq(userAppAccess.userId, user.id),
            eq(userAppAccess.clientId, client.id),
            eq(userAppAccess.isActive, true)
          )
        )
        .limit(1)

      // Check if access exists and is not expired
      const hasValidAccess = accessGrant && 
        (accessGrant.expiresAt === null || accessGrant.expiresAt > now)

      if (!hasValidAccess) {
        // User doesn't have access to this app
        await writeAuditLog({
          action: AuditEvents.OIDC_AUTHORIZE_DENIED,
          actorUserId: user.id,
          targetType: 'oidc_client',
          targetId: client.id,
          ip: getHeader(event, 'x-forwarded-for') || event.node?.req?.socket?.remoteAddress,
          userAgent: getHeader(event, 'user-agent'),
          metadata: {
            reason: 'no_access_grant',
            clientName: client.name
          }
        })

        // Redirect to access denied page
        doRedirect(event, `/access-denied?client_name=${encodeURIComponent(client.name)}&client_id=${encodeURIComponent(clientId)}`)
        return
      }
    }

    // For first-party apps, auto-approve
    // For third-party apps, check if user has granted consent (TODO: implement consent screen)
    const skipConsent = client.isFirstParty

    if (!skipConsent) {
      // TODO: Show consent screen if not already granted
      // For now, auto-approve all
    }

    // Generate authorization code
    const code = await createAuthorizationCode({
      clientId: client.clientId,
      userId: user.id,
      redirectUri,
      scopes: requestedScopes,
      nonce,
      codeChallenge,
      codeChallengeMethod
    })

    // Audit log
    await writeAuditLog({
      action: AuditEvents.OIDC_AUTHORIZE,
      actorUserId: user.id,
      targetType: 'oidc_client',
      targetId: client.id,
      ip: getHeader(event, 'x-forwarded-for') || event.node?.req?.socket?.remoteAddress,
      userAgent: getHeader(event, 'user-agent'),
      requestId: event.context.requestId,
      metadata: {
        clientId: client.clientId,
        clientName: client.name,
        scopes: requestedScopes,
        hasPKCE: !!codeChallenge
      }
    })

    // Build redirect URL with code
    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('code', code)
    redirectUrl.searchParams.set('state', state)

    doRedirect(event, redirectUrl.toString())
    return

  } catch (error: any) {
    console.error('Authorization error:', error)

    // If we have redirect_uri, redirect with error
    if (redirectUri) {
      doRedirect(event, buildErrorRedirect(
        redirectUri,
        'server_error',
        error.message || 'Internal server error',
        state
      ))
      return
    }

    throw error
  }
})

/**
 * Build error redirect URL
 */
function buildErrorRedirect(redirectUri: string, error: string, description: string, state?: string): string {
  const url = new URL(redirectUri)
  url.searchParams.set('error', error)
  url.searchParams.set('error_description', description)
  if (state) {
    url.searchParams.set('state', state)
  }
  return url.toString()
}
