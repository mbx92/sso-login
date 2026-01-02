import { defineEventHandler, createError } from 'h3'
import { db, accessGroupClients } from '../../../../db/index.ts'
import { eq, and } from 'drizzle-orm'
import { getAuthUser } from '../../../../utils/auth.ts'

/**
 * Custom parseBody to avoid h3 version conflicts
 */
async function parseBody(event: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const req = event.node?.req || event.req
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const bodyString = Buffer.concat(chunks).toString()
        if (bodyString === '') {
          resolve({})
        } else {
          resolve(JSON.parse(bodyString))
        }
      } catch (error) {
        console.error('[parseBody] JSON parse error:', error)
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Add a client to an access group
 * POST /api/admin/access-groups/:id/clients
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const groupId = event.context.params?.id
  const body = await parseBody(event)

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required'
    })
  }

  const { clientId } = body

  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'Client ID is required'
    })
  }

  try {
    // Check if client is already in the group
    const existing = await db
      .select()
      .from(accessGroupClients)
      .where(
        and(
          eq(accessGroupClients.groupId, groupId),
          eq(accessGroupClients.clientId, clientId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'Client is already in this group'
      })
    }

    // Add client to group
    const [newMember] = await db
      .insert(accessGroupClients)
      .values({
        groupId,
        clientId,
        addedBy: user.id
      })
      .returning()

    return {
      success: true,
      data: newMember
    }
  } catch (error: any) {
    console.error('Failed to add client to group:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to add client to group'
    })
  }
})
