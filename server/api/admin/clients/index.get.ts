import { defineEventHandler, getQuery, createError } from 'h3'
import { db, oidcClients } from '../../../db/index.ts'
import { count, like, desc } from 'drizzle-orm'

/**
 * List OIDC clients with pagination
 * GET /api/admin/clients?page=1&limit=20&search=...
 */
export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware check
  
  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const search = (query.search as string)?.trim()
  const offset = (page - 1) * limit

  try {
    // Build where clause
    const whereClause = search
      ? like(oidcClients.name, `%${search}%`)
      : undefined

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(oidcClients)
      .where(whereClause)

    // Get clients (exclude secret hash)
    const clientList = await db
      .select({
        id: oidcClients.id,
        clientId: oidcClients.clientId,
        name: oidcClients.name,
        description: oidcClients.description,
        redirectUris: oidcClients.redirectUris,
        postLogoutRedirectUris: oidcClients.postLogoutRedirectUris,
        grantTypes: oidcClients.grantTypes,
        responseTypes: oidcClients.responseTypes,
        scopes: oidcClients.scopes,
        tokenEndpointAuthMethod: oidcClients.tokenEndpointAuthMethod,
        isFirstParty: oidcClients.isFirstParty,
        requireAccessGrant: oidcClients.requireAccessGrant,
        isActive: oidcClients.isActive,
        createdAt: oidcClients.createdAt,
        updatedAt: oidcClients.updatedAt
      })
      .from(oidcClients)
      .where(whereClause)
      .orderBy(desc(oidcClients.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      data: clientList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to list clients')
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch clients'
    })
  }
})
