import { defineEventHandler } from 'h3'
import { db, divisions, sites } from '../../../db'
import { eq, and } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'

/**
 * Parse query from URL manually (h3 getQuery has issues)
 */
function parseQuery(event: any): Record<string, string> {
  try {
    const url = event.node?.req?.url || ''
    const queryString = url.split('?')[1] || ''
    const params: Record<string, string> = {}
    if (queryString) {
      queryString.split('&').forEach((pair: string) => {
        const [key, value] = pair.split('=')
        if (key) params[key] = decodeURIComponent(value || '')
      })
    }
    return params
  } catch {
    return {}
  }
}

export default defineEventHandler(async (event) => {
  const query = parseQuery(event)
  const siteId = query.siteId || undefined
  const user = getAuthUser(event)

  // Build where conditions
  const conditions = []
  
  // Filter by siteId from query parameter
  if (siteId) {
    conditions.push(eq(divisions.siteId, siteId))
  }
  // Filter by user's site if not superadmin AND user has siteId
  else if (user && user.roleId !== 'superadmin' && user.siteId) {
    conditions.push(eq(divisions.siteId, user.siteId))
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const allDivisions = await db.select({
    id: divisions.id,
    siteId: divisions.siteId,
    siteName: sites.name,
    code: divisions.code,
    name: divisions.name,
    description: divisions.description,
    isActive: divisions.isActive,
    createdAt: divisions.createdAt,
    updatedAt: divisions.updatedAt
  })
  .from(divisions)
  .leftJoin(sites, eq(divisions.siteId, sites.id))
  .where(whereClause)
  .orderBy(divisions.name)
  
  return {
    divisions: allDivisions
  }
})
