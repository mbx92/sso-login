import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db, oidcClients } from '../../../db/index.ts'
import { eq } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../services/audit.ts'

/**
 * Custom parseBody to avoid h3 version conflicts
 */
async function parseBody(event: any): Promise<any> {
  const req = event.node?.req || event.req
  
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Custom getHeader function
 */
function getHeader(event: any, name: string): string | undefined {
  const req = event.node?.req || event.req
  return req.headers[name.toLowerCase()]
}

interface UpdateClientBody {
  name?: string
  description?: string
  redirectUris?: string[]
  postLogoutRedirectUris?: string[]
  grantTypes?: string[]
  responseTypes?: string[]
  scopes?: string[]
  tokenEndpointAuthMethod?: string
  isFirstParty?: boolean
  isActive?: boolean
}

/**
 * Update an OIDC client
 * PUT /api/admin/clients/:id
 */
export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware check
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required'
    })
  }

  const body = await parseBody(event) as UpdateClientBody

  // Validate redirect URIs if provided
  if (body.redirectUris) {
    for (const uri of body.redirectUris) {
      try {
        new URL(uri)
      } catch {
        throw createError({
          statusCode: 400,
          message: `Invalid redirect URI: ${uri}`
        })
      }
    }
  }

  try {
    // Find existing client
    const [existing] = await db
      .select()
      .from(oidcClients)
      .where(eq(oidcClients.id, id))
      .limit(1)

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Client not found'
      })
    }

    // Build update object
    const updates: Partial<typeof oidcClients.$inferInsert> = {
      updatedAt: new Date()
    }

    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.redirectUris !== undefined) updates.redirectUris = body.redirectUris
    if (body.postLogoutRedirectUris !== undefined) updates.postLogoutRedirectUris = body.postLogoutRedirectUris
    if (body.grantTypes !== undefined) updates.grantTypes = body.grantTypes
    if (body.responseTypes !== undefined) updates.responseTypes = body.responseTypes
    if (body.scopes !== undefined) updates.scopes = body.scopes
    if (body.tokenEndpointAuthMethod !== undefined) updates.tokenEndpointAuthMethod = body.tokenEndpointAuthMethod
    if (body.isFirstParty !== undefined) updates.isFirstParty = body.isFirstParty
    if (body.isActive !== undefined) updates.isActive = body.isActive

    // Update client
    const [updated] = await db
      .update(oidcClients)
      .set(updates)
      .where(eq(oidcClients.id, id))
      .returning()

    // Audit log
    await writeAuditLog({
      action: AuditEvents.ADMIN_CLIENT_UPDATED,
      targetType: 'oidc_client',
      targetId: id,
      ip: getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress,
      userAgent: getHeader(event, 'user-agent'),
      requestId: event.context.requestId,
      metadata: {
        clientId: existing.clientId,
        changes: Object.keys(updates).filter(k => k !== 'updatedAt')
      }
    })

    return {
      success: true,
      client: {
        id: updated.id,
        clientId: updated.clientId,
        name: updated.name,
        description: updated.description,
        redirectUris: updated.redirectUris,
        postLogoutRedirectUris: updated.postLogoutRedirectUris,
        grantTypes: updated.grantTypes,
        responseTypes: updated.responseTypes,
        scopes: updated.scopes,
        tokenEndpointAuthMethod: updated.tokenEndpointAuthMethod,
        isFirstParty: updated.isFirstParty,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to update client')
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to update client'
    })
  }
})
