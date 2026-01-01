import { eq } from 'drizzle-orm'
import { db, users } from '../../../db'
import { createAuditLog } from '../../../services/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID user tidak valid'
    })
  }

  try {
    const [deletedUser] = await db.delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name
      })

    if (!deletedUser) {
      throw createError({
        statusCode: 404,
        message: 'User tidak ditemukan'
      })
    }

    await createAuditLog({
      userId: 'system',
      action: 'user.delete',
      resource: 'user',
      resourceId: id,
      details: { email: deletedUser.email, name: deletedUser.name },
      ipAddress: getRequestIP(event) || 'unknown',
      userAgent: getHeader(event, 'user-agent') || 'unknown'
    })

    return {
      success: true,
      message: 'User berhasil dihapus'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'User tidak dapat dihapus karena masih memiliki data terkait'
      })
    }
    console.error('Delete user error:', error)
    throw createError({
      statusCode: 500,
      message: 'Gagal menghapus user'
    })
  }
})
