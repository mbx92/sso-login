import { defineEventHandler, createError } from 'h3'
import { db, userAppAccess, users, oidcClients } from '../../../db/index.ts'
import { eq, inArray } from 'drizzle-orm'
import { writeAuditLog } from '../../../services/audit.ts'

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
 * Get session user from cookie
 */
function getSessionUser(event: any): { userId: string; name: string } | null {
  const cookies = event.node?.req?.headers?.cookie || ''
  const userCookie = cookies.split(';').find((c: string) => c.trim().startsWith('sso_user='))
  if (!userCookie) return null

  try {
    const userDataStr = decodeURIComponent(userCookie.split('=')[1])
    return JSON.parse(userDataStr)
  } catch {
    return null
  }
}

/**
 * Bulk grant user access to an application
 * POST /api/admin/user-access/bulk
 * Body: { userIds: string[], clientId: string, expiresAt?: string, notes?: string }
 */
export default defineEventHandler(async (event) => {
  const body = await parseBody(event)
  const { userIds, clientId, expiresAt, notes } = body

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'userIds must be a non-empty array'
    })
  }

  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'clientId is required'
    })
  }

  try {
    // Verify client exists
    const [client] = await db
      .select()
      .from(oidcClients)
      .where(eq(oidcClients.id, clientId))
      .limit(1)

    if (!client) {
      throw createError({
        statusCode: 404,
        message: 'Client/Application not found'
      })
    }

    // Verify all users exist
    const existingUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, userIds))

    if (existingUsers.length !== userIds.length) {
      throw createError({
        statusCode: 400,
        message: 'Some user IDs are invalid'
      })
    }

    // Get current admin user
    const sessionUser = getSessionUser(event)

    // Get existing access records
    const existingAccess = await db
      .select({ userId: userAppAccess.userId })
      .from(userAppAccess)
      .where(eq(userAppAccess.clientId, clientId))

    const existingUserIds = new Set(existingAccess.map(a => a.userId))

    // Separate new and existing
    const newUserIds = userIds.filter((id: string) => !existingUserIds.has(id))
    const updateUserIds = userIds.filter((id: string) => existingUserIds.has(id))

    let insertedCount = 0
    let updatedCount = 0

    // Insert new access records
    if (newUserIds.length > 0) {
      const insertValues = newUserIds.map((userId: string) => ({
        userId,
        clientId,
        grantedBy: sessionUser?.userId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        isActive: true
      }))

      await db.insert(userAppAccess).values(insertValues)
      insertedCount = newUserIds.length
    }

    // Update existing access records
    for (const userId of updateUserIds) {
      await db
        .update(userAppAccess)
        .set({
          isActive: true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          notes: notes || null,
          grantedBy: sessionUser?.userId || null,
          grantedAt: new Date()
        })
        .where(eq(userAppAccess.userId, userId))
      updatedCount++
    }

    // Audit log
    await writeAuditLog({
      action: 'ADMIN_USER_ACCESS_BULK_GRANTED' as any,
      actorUserId: sessionUser?.userId,
      targetType: 'oidc_client',
      targetId: clientId,
      metadata: {
        clientName: client.name,
        userCount: userIds.length,
        insertedCount,
        updatedCount,
        expiresAt
      }
    })

    return {
      success: true,
      message: `Access granted to ${userIds.length} users for ${client.name}`,
      data: {
        total: userIds.length,
        inserted: insertedCount,
        updated: updatedCount
      }
    }
  } catch (error: any) {
    console.error('Failed to bulk grant user access:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to bulk grant user access'
    })
  }
})
