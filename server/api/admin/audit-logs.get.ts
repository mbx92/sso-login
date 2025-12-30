import { db, auditLogs, users } from '../../db/index.ts'
import { eq, desc, and, gte, lte, like, count } from 'drizzle-orm'

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

/**
 * List audit logs with pagination and filtering
 * GET /api/admin/audit-logs?page=1&limit=50&action=...&from=...&to=...
 */
export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware check
  
  const query = parseQuery(event)
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50))
  const action = query.action || undefined
  const targetType = query.targetType || undefined
  const from = query.from ? new Date(query.from) : undefined
  const to = query.to ? new Date(query.to) : undefined
  const offset = (page - 1) * limit

  try {
    // Build where conditions
    const conditions = []
    
    if (action) {
      conditions.push(like(auditLogs.action, `%${action}%`))
    }
    
    if (targetType) {
      conditions.push(eq(auditLogs.targetType, targetType))
    }
    
    if (from) {
      conditions.push(gte(auditLogs.at, from))
    }
    
    if (to) {
      conditions.push(lte(auditLogs.at, to))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(whereClause)

    // Get logs with actor info
    const logs = await db
      .select({
        id: auditLogs.id,
        at: auditLogs.at,
        actorUserId: auditLogs.actorUserId,
        actorType: auditLogs.actorType,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        ip: auditLogs.ip,
        userAgent: auditLogs.userAgent,
        requestId: auditLogs.requestId,
        metadata: auditLogs.metadata,
        actorEmail: users.email,
        actorName: users.name
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.at))
      .limit(limit)
      .offset(offset)

    return {
      data: logs.map(log => ({
        id: log.id,
        at: log.at,
        actor: log.actorUserId ? {
          id: log.actorUserId,
          email: log.actorEmail,
          name: log.actorName,
          type: log.actorType
        } : {
          type: log.actorType
        },
        action: log.action,
        target: {
          type: log.targetType,
          id: log.targetId
        },
        context: {
          ip: log.ip,
          userAgent: log.userAgent,
          requestId: log.requestId
        },
        metadata: log.metadata
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to list audit logs')
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch audit logs'
    })
  }
})
