import { defineEventHandler, createError } from 'h3'
import { db, accessGroups } from '../../../db/index.ts'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth.ts'

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
        resolve(JSON.parse(body))
      } catch (error) {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Update an access group
 * PUT /api/admin/access-groups/:id
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

  const { name, description, isActive } = body

  try {
    const [updatedGroup] = await db
      .update(accessGroups)
      .set({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date()
      })
      .where(eq(accessGroups.id, groupId))
      .returning()

    if (!updatedGroup) {
      throw createError({
        statusCode: 404,
        message: 'Group not found'
      })
    }

    return {
      success: true,
      data: updatedGroup
    }
  } catch (error: any) {
    console.error('Failed to update access group:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update access group'
    })
  }
})
