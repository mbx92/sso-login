import { db, sites } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import { getAuthUser } from '../../../utils/auth'

const createSiteSchema = z.object({
  code: z.string().min(1, 'Kode site wajib diisi').max(50),
  name: z.string().min(1, 'Nama site wajib diisi').max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  // Authorization: Only superadmin can create sites
  if (user?.roleId !== 'superadmin') {
    throw createError({
      statusCode: 403,
      message: 'Hanya superadmin yang dapat membuat site baru'
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
  
  const validation = createSiteSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const { code, name, description, address, isActive } = validation.data

  try {
    const [newSite] = await db.insert(sites).values({
      code,
      name,
      description: description || null,
      address: address || null,
      isActive
    }).returning()

    const user = getAuthUser(event)
    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'site.create',
      resource: 'site',
      resourceId: newSite.id,
      details: { code, name },
      ipAddress: event.node.req.socket.remoteAddress || '',
      userAgent: event.node.req.headers['user-agent'] || ''
    }).catch(console.error)

    return {
      success: true,
      site: newSite
    }
  } catch (error: any) {
    console.error('Error creating site:', error)
    
    if (error.statusCode) throw error
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Kode site sudah digunakan'
      })
    }
    throw createError({
      statusCode: 500,
      message: `Gagal membuat site: ${error.message || 'Unknown error'}`
    })
  }
})
