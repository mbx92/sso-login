import { defineEventHandler, createError } from 'h3'
import { verifyAccessToken, getUserInfo } from '../../services/oidc.ts'

/**
 * Custom getHeader function
 */
function getHeader(event: any, name: string): string | undefined {
  const req = event.node?.req || event.req
  return req.headers[name.toLowerCase()]
}

/**
 * OIDC UserInfo Endpoint
 * GET /api/oidc/userinfo
 * 
 * Returns user claims for the authenticated user
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Missing or invalid Authorization header'
    })
  }

  const accessToken = authHeader.slice(7)

  try {
    // Verify access token
    const tokenPayload = await verifyAccessToken(accessToken)

    if (!tokenPayload) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired access token'
      })
    }

    // Get user info
    const userInfo = await getUserInfo(tokenPayload.sub)

    if (!userInfo) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    return userInfo

  } catch (error: any) {
    console.error('UserInfo endpoint error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})
