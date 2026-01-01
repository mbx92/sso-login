import { defineEventHandler, createError, getHeader, getRequestIP } from 'h3'
import { db, units, sites, divisions } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import { getAuthUser } from '../../../utils/auth'
import { eq } from 'drizzle-orm'

const createUnitSchema = z.object({
  siteId: z.string().uuid('ID site tidak valid'),
  divisionId: z.string().uuid('ID divisi tidak valid'),
  code: z.string().min(1, 'Kode unit wajib diisi').max(50),
  name: z.string().min(1, 'Nama unit wajib diisi').max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
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
  const body = await parseBody(event)
  
  const validation = createUnitSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const { siteId, divisionId, code, name, description, isActive } = validation.data

  // Authorization check: non-superadmin can only create units in their own site
  if (user?.roleId !== 'superadmin' && user?.siteId && user.siteId !== siteId) {
    throw createError({
      statusCode: 403,
      message: 'Anda tidak memiliki akses untuk membuat unit di site ini'
    })
  }

  try {
    // Verify site exists
    const site = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1)
    if (site.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Site tidak ditemukan'
      })
    }

    // Verify division exists and belongs to the same site
    const division = await db.select().from(divisions).where(eq(divisions.id, divisionId)).limit(1)
    if (division.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Divisi tidak ditemukan'
      })
    }
    if (division[0].siteId !== siteId) {
      throw createError({
        statusCode: 400,
        message: 'Divisi tidak berada di site yang sama'
      })
    }

    const [newUnit] = await db.insert(units).values({
      siteId,
      divisionId,
      code,
      name,
      description: description || null,
      isActive
    }).returning()

    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'unit.create',
      resource: 'unit',
      resourceId: newUnit.id,
      details: { siteId, divisionId, code, name },
      ipAddress: getRequestIP(event) || event.node?.req?.socket?.remoteAddress || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    }).catch(console.error)

    return {
      success: true,
      unit: newUnit
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error creating unit:', error)
    
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
      message: `Gagal membuat unit: ${error.message || 'Unknown error'}`
    })
  }
})
