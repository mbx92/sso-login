import { eq } from 'drizzle-orm'
import { db, sites } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import { getAuthUser } from '../../../utils/auth'

const updateSiteSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  useDivisions: z.boolean().optional(),
  useUnits: z.boolean().optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  
  // Authorization: Only superadmin can update sites
  if (user?.roleId !== 'superadmin') {
    throw createError({
      statusCode: 403,
      message: 'Hanya superadmin yang dapat mengubah site'
    })
  }
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID site tidak valid'
    })
  }

  // Manual body parsing sebagai workaround
  let body: any
  
  const rawBody = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    event.node.req.on('data', (chunk) => chunks.push(chunk))
    event.node.req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    event.node.req.on('error', reject)
  })
  
  try {
    body = JSON.parse(rawBody || '{}')
  } catch (e) {
    body = {}
  }
  
  const validation = updateSiteSchema.safeParse(body)
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
    const [updatedSite] = await db.update(sites)
      .set(updateData)
      .where(eq(sites.id, id))
      .returning()

    if (!updatedSite) {
      throw createError({
        statusCode: 404,
        message: 'Site tidak ditemukan'
      })
    }

    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'site.update',
      resource: 'site',
      resourceId: id,
      details: updateData,
      ipAddress: event.node.req.socket.remoteAddress || '',
      userAgent: event.node.req.headers['user-agent'] || ''
    }).catch(console.error)

    return {
      success: true,
      site: updatedSite
    }
  } catch (error: any) {
    console.error('Error updating site:', error)
    
    if (error.statusCode) throw error
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Kode site sudah digunakan'
      })
    }
    throw createError({
      statusCode: 500,
      message: `Gagal mengupdate site: ${error.message || 'Unknown error'}`
    })
  }
})
