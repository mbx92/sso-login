import { db, users } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { z } from 'zod'
import * as argon2 from 'argon2'

const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  name: z.string().min(1, 'Nama wajib diisi').max(255),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  employeeId: z.string().optional(),
  unitId: z.string().uuid('ID unit tidak valid').optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending']).default('active')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const validation = createUserSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    })
  }

  const { email, name, password, employeeId, unitId, status } = validation.data

  try {
    // Hash password using argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4
    })

    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      name,
      passwordHash: passwordHash,
      employeeId: employeeId || null,
      unitId: unitId || null,
      status
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      employeeId: users.employeeId,
      unitId: users.unitId,
      status: users.status,
      createdAt: users.createdAt
    })

    await createAuditLog({
      userId: 'system',
      action: 'user.create',
      resource: 'user',
      resourceId: newUser.id,
      details: { email, name, employeeId, unitId, source: 'manual' },
      ipAddress: getRequestIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    })

    return {
      success: true,
      user: newUser
    }
  } catch (error: any) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        message: 'Email sudah terdaftar'
      })
    }
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'Unit tidak ditemukan'
      })
    }
    console.error('Create user error:', error)
    throw createError({
      statusCode: 500,
      message: 'Gagal membuat user'
    })
  }
})
