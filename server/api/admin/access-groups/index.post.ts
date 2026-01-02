import { defineEventHandler, createError } from 'h3'
import { db, accessGroups } from '../../../db/index.ts'
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
 * Create a new access group
 * POST /api/admin/access-groups
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const body = await parseBody(event)

  const { name, description, siteId } = body

  if (!name) {
    throw createError({
      statusCode: 400,
      message: 'Group name is required'
    })
  }

  try {
    const [newGroup] = await db
      .insert(accessGroups)
      .values({
        name,
        description: description || null,
        siteId: siteId || null,
        createdBy: user.id,
        isActive: true
      })
      .returning()

    return {
      success: true,
      data: newGroup
    }
  } catch (error: any) {
    console.error('Failed to create access group:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create access group'
    })
  }
})
