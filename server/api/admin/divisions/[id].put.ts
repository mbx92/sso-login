import { defineEventHandler, createError, getHeader, getRequestIP, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db, divisions } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import { getAuthUser } from '../../../utils/auth'

const updateDivisionSchema = z.object({
  siteId: z.string().uuid().optional(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional()
})

/**
 * Parse body manually (h3 readBody has issues)
 */
async function parseBody(event: any): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    const req = event.node?.req
    if (!req) {
      resolve({})
      return
    }
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        resolve(body)
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID divisi tidak valid'
    })
  }

  // Check if division exists and get current data for authorization
  const existingDivision = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)
  
  if (existingDivision.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Divisi tidak ditemukan'
    })
  }

  // Authorization check: non-superadmin can only update divisions in their own site
  if (user?.roleId !== 'superadmin' && user?.siteId && user.siteId !== existingDivision[0].siteId) {
    throw createError({
      statusCode: 403,
      message: 'Anda tidak memiliki akses untuk mengubah divisi ini'
    })
  }

  const body = await parseBody(event)
  
  const validation = updateDivisionSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const updateData = {
    ...validation.data,
    updatedAt: new Date()
  }

  try {
    const [updatedDivision] = await db.update(divisions)
      .set(updateData)
      .where(eq(divisions.id, id))
      .returning()

    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'division.update',
      resource: 'division',
      resourceId: id,
      details: updateData,
      ipAddress: getRequestIP(event) || event.node?.req?.socket?.remoteAddress || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    }).catch(console.error)

    return {
      success: true,
      division: updatedDivision
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error updating division:', error)
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Kode divisi sudah digunakan'
      })
    }
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'Site tidak ditemukan'
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Gagal mengupdate divisi'
    })
  }
})
