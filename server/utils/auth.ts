/**
 * Auth helper untuk mendapatkan user dari session
 */

import type { H3Event } from 'h3'

export interface AuthUser {
  userId: string
  email: string
  name: string
  employeeId?: string | null
  roles?: string[] // New: array of role names
  roleId?: string | null // Legacy
  roleName?: string | null // Legacy
  siteId?: string | null
  department?: string | null
  position?: string | null
}

/**
 * Get authenticated user from cookie
 */
export function getAuthUser(event: H3Event): AuthUser | null {
  try {
    const cookieHeader = event.node.req.headers.cookie
    if (!cookieHeader) return null

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const userCookie = cookies['sso_user']
    if (!userCookie) return null

    const decoded = decodeURIComponent(userCookie)
    const user = JSON.parse(decoded)
    
    return user as AuthUser
  } catch (error) {
    console.error('Error getting auth user:', error)
    return null
  }
}

/**
 * Require authenticated user, throw error if not found
 */
export function requireAuthUser(event: H3Event): AuthUser {
  const user = getAuthUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }
  return user
}
