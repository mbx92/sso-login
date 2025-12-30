import { defineEventHandler, getRouterParam, createError, getHeader } from 'h3'
import { db, oidcClients } from '../../../db/index.ts'
import { eq } from 'drizzle-orm'
import { writeAuditLog, AuditEvents } from '../../../services/audit.ts'

/**
 * Delete an OIDC client
 * DELETE /api/admin/clients/:id
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

    // Delete client
    await db
      .delete(oidcClients)
      .where(eq(oidcClients.id, id))

    // Audit log
    await writeAuditLog({
      action: AuditEvents.ADMIN_CLIENT_DELETED,
      targetType: 'oidc_client',
      targetId: id,
      ip: getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress,
      userAgent: getHeader(event, 'user-agent'),
      requestId: event.context.requestId,
      metadata: {
        clientId: existing.clientId,
        name: existing.name
      }
    })

    return {
      success: true,
      message: `Client "${existing.name}" deleted successfully`
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to delete client')
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to delete client'
    })
  }
})
