import { defineEventHandler, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db, units, users } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = getAuthUser(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID unit tidak valid'
    })
  }

  try {
    // Check if unit exists
    const unit = await db.select().from(units).where(eq(units.id, id)).limit(1)

    if (unit.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Unit tidak ditemukan'
      })
    }

    // Authorization check: non-superadmin can only delete units in their own site
    if (user?.roleId !== 'superadmin' && user?.siteId && user.siteId !== unit[0].siteId) {
      throw createError({
        statusCode: 403,
        message: 'Anda tidak memiliki akses untuk menghapus unit ini'
      })
    }

    // Check if unit has users
    const relatedUsers = await db.select().from(users).where(eq(users.unitId, id)).limit(1)

    if (relatedUsers.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'Unit tidak dapat dihapus karena masih memiliki user. Pindahkan user terlebih dahulu.'
      })
    }

    // Delete the unit
    await db.delete(units).where(eq(units.id, id))

    // Create audit log
    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'unit.delete',
      resource: 'unit',
      resourceId: id,
      details: { name: unit[0].name, code: unit[0].code },
      ipAddress: event.node?.req?.socket?.remoteAddress || 'unknown',
      userAgent: event.node?.req?.headers['user-agent'] || 'unknown'
    }).catch(console.error)

    return {
      success: true,
      message: 'Unit berhasil dihapus'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error deleting unit:', error)
    
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'Unit tidak dapat dihapus karena masih digunakan'
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Gagal menghapus unit'
    })
  }
})
