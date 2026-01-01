import { eq } from 'drizzle-orm'
import { db, roles } from '../../../db'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roles'
import { z } from 'zod'

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  siteId: z.string().uuid().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = getAuthUser(event)
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID role tidak valid'
    })
  }

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
  
  const validation = updateRoleSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  try {
    // Check if role exists and is not system role
    const [existingRole] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
    
    if (!existingRole) {
      throw createError({
        statusCode: 404,
        message: 'Role tidak ditemukan'
      })
    }
    
    if (existingRole.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'Role sistem tidak dapat diubah'
      })
    }
    
    // Check access permission
    if (user && !isSuperAdmin(user) && user.siteId) {
      if (existingRole.siteId && existingRole.siteId !== user.siteId) {
        throw createError({
          statusCode: 403,
          message: 'Anda tidak memiliki akses untuk mengubah role ini'
        })
      }
    }

    const updateData: any = {
      ...validation.data,
      updatedAt: new Date()
    }

    const [updatedRole] = await db.update(roles)
      .set(updateData)
      .where(eq(roles.id, id))
      .returning()

    return {
      success: true,
      role: updatedRole
    }
  } catch (error: any) {
    console.error('Error updating role:', error)
    
    if (error.statusCode) throw error
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Nama role sudah digunakan'
      })
    }
    throw createError({
      statusCode: 500,
      message: `Gagal mengupdate role: ${error.message || 'Unknown error'}`
    })
  }
})
