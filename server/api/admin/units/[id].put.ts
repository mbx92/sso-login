import { defineEventHandler, createError, getHeader, getRequestIP, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db, units } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import { getAuthUser } from '../../../utils/auth'

const updateUnitSchema = z.object({
  siteId: z.string().uuid().optional(),
  divisionId: z.string().uuid().optional(),
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
      message: 'ID unit tidak valid'
    })
  }

  // Check if unit exists and get current data for authorization
  const existingUnit = await db.select().from(units).where(eq(units.id, id)).limit(1)
  
  if (existingUnit.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'Unit tidak ditemukan'
    })
  }

  // Authorization check: non-superadmin can only update units in their own site
  if (user?.roleId !== 'superadmin' && user?.siteId && user.siteId !== existingUnit[0].siteId) {
    throw createError({
      statusCode: 403,
      message: 'Anda tidak memiliki akses untuk mengubah unit ini'
    })
  }

  const body = await parseBody(event)
  
  const validation = updateUnitSchema.safeParse(body)
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
    const [updatedUnit] = await db.update(units)
      .set(updateData)
      .where(eq(units.id, id))
      .returning()

    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'unit.update',
      resource: 'unit',
      resourceId: id,
      details: updateData,
      ipAddress: getRequestIP(event) || event.node?.req?.socket?.remoteAddress || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    }).catch(console.error)

    return {
      success: true,
      unit: updatedUnit
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error updating unit:', error)
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Kode unit sudah digunakan'
      })
    }
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'Divisi tidak ditemukan'
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Gagal mengupdate unit'
    })
  }
})
