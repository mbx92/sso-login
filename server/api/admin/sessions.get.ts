import { db, oidcKv, users, oidcClients, auditLogs } from '../../db/index'
import { gte, desc, inArray, eq, and } from 'drizzle-orm'

function parseQuery(event: any): Record<string, string> {
  const url = event.node.req.url || ''
  const queryString = url.split('?')[1] || ''
  const params: Record<string, string> = {}
  
  if (queryString) {
    const pairs = queryString.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }
  }
  
  return params
}

interface ActiveSession {
  id: string
  userId: string
  userName: string
  userEmail: string
  clientId: string
  clientName: string
  ip: string
  userAgent: string
  loginAt: string
  expiresAt: string | null
}

/**
 * Get active sessions
 * GET /api/admin/sessions
 */
export default defineEventHandler(async (event) => {
  try {
    const query = parseQuery(event)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50))
    
    const now = new Date()
    
    // Get all active entries from oidc_kv that haven't expired
    // This includes RefreshToken (main indicator of active session)
    const allEntries = await db
      .select({
        id: oidcKv.id,
        model: oidcKv.model,
        key: oidcKv.key,
        payload: oidcKv.payload,
        expiresAt: oidcKv.expiresAt,
        grantId: oidcKv.grantId
      })
      .from(oidcKv)
      .where(gte(oidcKv.expiresAt, now))
      .orderBy(desc(oidcKv.expiresAt))
      .limit(limit * 3)

    // Filter for refresh tokens primarily (indicator of active login session)
    const sessions = allEntries.filter(e => 
      e.model === 'RefreshToken' || 
      e.model === 'Session' || 
      e.model === 'AccessToken' ||
      e.model === 'Grant'
    )

    // Collect unique user IDs and client IDs
    const userIds = new Set<string>()
    const clientIds = new Set<string>()
    
    for (const session of sessions) {
      const payload = session.payload as any
      if (payload?.userId) {
        userIds.add(payload.userId)
      }
      if (payload?.accountId) {
        userIds.add(payload.accountId)
      }
      if (payload?.clientId) {
        clientIds.add(payload.clientId)
      }
    }

    // Fetch user details
    const userList = userIds.size > 0 ? await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, Array.from(userIds)))
      : []
    
    const userMap = new Map(userList.map(u => [u.id, u]))

    // Fetch client details
    const clientList = clientIds.size > 0 ? await db
      .select({ clientId: oidcClients.clientId, name: oidcClients.name })
      .from(oidcClients)
      .where(inArray(oidcClients.clientId, Array.from(clientIds)))
      : []
    
    const clientMap = new Map(clientList.map(c => [c.clientId, c]))

    // Fetch last login info from audit logs for each user
    const loginInfoMap = new Map<string, { ip: string; userAgent: string; loginAt: Date }>()
    
    if (userIds.size > 0) {
      const loginLogs = await db
        .select({
          userId: auditLogs.actorUserId,
          ip: auditLogs.ip,
          userAgent: auditLogs.userAgent,
          at: auditLogs.at,
          metadata: auditLogs.metadata
        })
        .from(auditLogs)
        .where(
          and(
            inArray(auditLogs.actorUserId, Array.from(userIds)),
            eq(auditLogs.action, 'AUTH_LOGIN_SUCCESS')
          )
        )
        .orderBy(desc(auditLogs.at))
        .limit(100)
      
      // Group by user, keeping the most recent login
      for (const log of loginLogs) {
        if (log.userId && !loginInfoMap.has(log.userId)) {
          loginInfoMap.set(log.userId, {
            ip: log.ip || 'Unknown',
            userAgent: log.userAgent || 'Unknown',
            loginAt: log.at
          })
        }
      }
    }

    // Build response
    const activeSessions: ActiveSession[] = []
    const seenUsers = new Set<string>()

    for (const session of sessions) {
      const payload = session.payload as any
      const userId = payload?.userId || payload?.accountId
      const clientId = payload?.clientId
      
      // Skip if no user or client
      if (!userId || !clientId) continue
      
      // Skip if we've already seen this user-client combo
      const key = `${userId}-${clientId}`
      if (seenUsers.has(key)) continue
      seenUsers.add(key)
      
      const user = userMap.get(userId)
      const client = clientMap.get(clientId)
      const loginInfo = loginInfoMap.get(userId)
      
      activeSessions.push({
        id: session.id,
        userId: userId || 'unknown',
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || 'unknown@email.com',
        clientId: clientId || 'unknown',
        clientName: client?.name || clientId || 'Unknown App',
        ip: loginInfo?.ip || 'Unknown',
        userAgent: loginInfo?.userAgent || 'Unknown',
        loginAt: loginInfo?.loginAt?.toISOString() || new Date().toISOString(),
        expiresAt: session.expiresAt?.toISOString() || null
      })
    }

    return {
      data: activeSessions,
      total: activeSessions.length
    }
  } catch (error) {
    console.error('Error fetching active sessions:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch active sessions'
    })
  }
})
