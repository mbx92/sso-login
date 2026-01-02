import { defineEventHandler, createError } from 'h3'
import { db, accessGroups } from '../../../db/index.ts'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth.ts'

/**
 * Delete an access group
 * DELETE /api/admin/access-groups/:id
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const groupId = event.context.params?.id

  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: 'Group ID is required'
    })
  }

  try {
    const [deletedGroup] = await db
      .delete(accessGroups)
      .where(eq(accessGroups.id, groupId))
      .returning()

    if (!deletedGroup) {
      throw createError({
        statusCode: 404,
        message: 'Group not found'
      })
    }

    return {
      success: true,
      data: deletedGroup
    }
  } catch (error: any) {
    console.error('Failed to delete access group:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete access group'
    })
  }
})
