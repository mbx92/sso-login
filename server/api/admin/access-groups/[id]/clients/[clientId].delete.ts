import { defineEventHandler, createError } from 'h3'
import { db, accessGroupClients } from '../../../../../db/index.ts'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../../../utils/auth.ts'

/**
 * Remove a client from an access group
 * DELETE /api/admin/access-groups/:id/clients/:clientId
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const groupId = event.context.params?.id
  const url = new URL(event.node.req.url || '', `http://${event.node.req.headers.host}`)
  const pathParts = url.pathname.split('/')
  const membershipId = pathParts[pathParts.length - 1]

  if (!groupId || !membershipId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID and membership ID are required'
    })
  }

  try {
    const [deleted] = await db
      .delete(accessGroupClients)
      .where(eq(accessGroupClients.id, membershipId))
      .returning()

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: 'Membership not found'
      })
    }

    return {
      success: true,
      data: deleted
    }
  } catch (error: any) {
    console.error('Failed to remove client from group:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to remove client from group'
    })
  }
})
