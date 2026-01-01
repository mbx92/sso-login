import { db, roles } from '../../../db'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roles'
import { z } from 'zod'

const createRoleSchema = z.object({
  name: z.string().min(1, 'Nama role wajib diisi').max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  siteId: z.string().uuid().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  // Manual body parsing
  const rawBody = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    const req = event.node?.req
    if (!req) {
      resolve('{}')
      return
    }
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
  
  let body: any
  try {
    body = JSON.parse(rawBody || '{}')
  } catch (e) {
    body = {}
  }
  
  const validation = createRoleSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const { name, description, permissions, siteId } = validation.data

  // Jika bukan superadmin dan mencoba buat role global, gunakan siteId user
  let finalSiteId = siteId
  if (user && !isSuperAdmin(user) && !siteId && user.siteId) {
    finalSiteId = user.siteId
  }

  try {
    const [newRole] = await db.insert(roles).values({
      name,
      description: description || null,
      permissions: permissions,
      siteId: finalSiteId || null,
      isSystem: false
    }).returning()

    return {
      success: true,
      role: newRole
    }
  } catch (error: any) {
    console.error('Error creating role:', error)
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Nama role sudah digunakan'
      })
    }
    throw createError({
      statusCode: 500,
      message: `Gagal membuat role: ${error.message || 'Unknown error'}`
    })
  }
})
