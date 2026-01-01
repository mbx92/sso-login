import { eq } from 'drizzle-orm'
import { db, users } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid').optional(),
  name: z.string().min(1, 'Nama wajib diisi').max(255).optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  employeeId: z.string().optional().nullable(),
  unitId: z.string().uuid('ID unit tidak valid').optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending']).optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID user tidak valid'
    })
  }

  const body = await readBody(event)
  
  const validation = updateUserSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const { password, email, ...otherData } = validation.data

  const updateData: Record<string, any> = {
    ...otherData,
    updatedAt: new Date()
  }

  // Hash password if provided
  if (password) {
    updateData.password = await bcrypt.hash(password, 12)
  }

  // Lowercase email if provided
  if (email) {
    updateData.email = email.toLowerCase()
  }

  try {
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        employeeId: users.employeeId,
        unitId: users.unitId,
        status: users.status,
        updatedAt: users.updatedAt
      })

    if (!updatedUser) {
      throw createError({
        statusCode: 404,
        message: 'User tidak ditemukan'
      })
    }

    await createAuditLog({
      userId: 'system',
      action: 'user.update',
      resource: 'user',
      resourceId: id,
      details: { ...otherData, email, passwordChanged: !!password },
      ipAddress: getRequestIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    })

    return {
      success: true,
      user: updatedUser
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Email sudah digunakan'
      })
    }
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'Unit tidak ditemukan'
      })
    }
    console.error('Update user error:', error)
    throw createError({
      statusCode: 500,
      message: 'Gagal mengupdate user'
    })
  }
})
