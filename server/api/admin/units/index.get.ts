import { defineEventHandler } from 'h3'
import { db, units, divisions, sites } from '../../../db'
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
  const divisionId = query.divisionId || undefined
  const user = getAuthUser(event)

  // Build where conditions
  const conditions = []
  
  // Filter by divisionId
  if (divisionId) {
    conditions.push(eq(units.divisionId, divisionId))
  }
  
  // Filter by siteId from query parameter
  if (siteId) {
    conditions.push(eq(units.siteId, siteId))
  }
  // Filter by user's site if not superadmin AND user has siteId
  else if (user && user.roleId !== 'superadmin' && user.siteId) {
    conditions.push(eq(units.siteId, user.siteId))
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const allUnits = await db.select({
    id: units.id,
    siteId: units.siteId,
    siteName: sites.name,
    divisionId: units.divisionId,
    divisionName: divisions.name,
    code: units.code,
    name: units.name,
    description: units.description,
    isActive: units.isActive,
    createdAt: units.createdAt,
    updatedAt: units.updatedAt
  })
  .from(units)
  .leftJoin(sites, eq(units.siteId, sites.id))
  .leftJoin(divisions, eq(units.divisionId, divisions.id))
  .where(whereClause)
  .orderBy(units.name)
  
  return {
    units: allUnits
  }
})
