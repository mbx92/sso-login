import { db, users } from '../db/index'
import { eq } from 'drizzle-orm'

// Track last update time per user to debounce updates
const lastUpdateCache = new Map<string, number>()
const UPDATE_INTERVAL_MS = 60 * 1000 // 1 minute

/**
 * Middleware to track user activity for online status
 * Updates lastActivityAt column when user makes authenticated requests
 * Debounced to avoid excessive DB writes
 */
export default defineEventHandler(async (event) => {
  // Skip for non-API routes
  const path = event.path || ''
  if (!path.startsWith('/api/')) {
    return
  }
  
  // Skip for certain endpoints that shouldn't update activity
  const skipPaths = [
    '/api/admin/sessions', // Don't update activity just from viewing sessions page
    '/api/oidc/authorize',
    '/api/oidc/token',
    '/api/auth/login',
    '/api/auth/logout'
  ]
  
  if (skipPaths.some(p => path.startsWith(p))) {
    return
  }
  
  // Try to get user from cookie
  const userCookie = event.node?.req.headers.cookie
    ?.split(';')
    .find(c => c.trim().startsWith('sso_user='))
    ?.split('=')[1]

  if (!userCookie) {
    return
  }

  let userId: string | null = null
  try {
    const userData = JSON.parse(decodeURIComponent(userCookie))
    userId = userData.userId
  } catch {
    return
  }

  if (!userId) {
    return
  }

  // Check if we should update (debounce)
  const now = Date.now()
  const lastUpdate = lastUpdateCache.get(userId) || 0
  
  if (now - lastUpdate < UPDATE_INTERVAL_MS) {
    return // Skip update, too recent
  }

  // Update last activity in background (don't await to avoid blocking)
  lastUpdateCache.set(userId, now)
  
  db.update(users)
    .set({ lastActivityAt: new Date() })
    .where(eq(users.id, userId))
    .catch(error => {
      console.error('Failed to update user activity:', error)
    })
})
