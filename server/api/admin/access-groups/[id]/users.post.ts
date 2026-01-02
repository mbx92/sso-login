import { defineEventHandler, createError } from 'h3'
import { db, accessGroupUsers } from '../../../../db/index.ts'
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
 * Add a user to an access group
 * POST /api/admin/access-groups/:id/users
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const groupId = event.context.params?.id
  
  // Parse body directly
  const body = await parseBody(event)

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required'
    })
  }

  const { userId } = body

  if (!userId) {
    console.error('[Add User to Group] User ID missing. Body:', body)
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  try {
    // Check if user is already in the group
    const existing = await db
      .select()
      .from(accessGroupUsers)
      .where(
        and(
          eq(accessGroupUsers.groupId, groupId),
          eq(accessGroupUsers.userId, userId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'User is already in this group'
      })
    }

    // Add user to group
    const [newMember] = await db
      .insert(accessGroupUsers)
      .values({
        groupId,
        userId,
        addedBy: user.id
      })
      .returning()

    return {
      success: true,
      data: newMember
    }
  } catch (error: any) {
    console.error('Failed to add user to group:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to add user to group'
    })
  }
})
