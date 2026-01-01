import { defineEventHandler, createError, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db, divisions, units } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = getAuthUser(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID divisi tidak valid'
    })
  }

  try {
    // Check if division exists
    const division = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1)

    if (division.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Divisi tidak ditemukan'
      })
    }

    // Authorization check: non-superadmin can only delete divisions in their own site
    if (user?.roleId !== 'superadmin' && user?.siteId && user.siteId !== division[0].siteId) {
      throw createError({
        statusCode: 403,
        message: 'Anda tidak memiliki akses untuk menghapus divisi ini'
      })
    }

    // Check if division has units
    const relatedUnits = await db.select().from(units).where(eq(units.divisionId, id)).limit(1)

    if (relatedUnits.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'Divisi tidak dapat dihapus karena masih memiliki unit. Hapus atau pindahkan unit terlebih dahulu.'
      })
    }

    // Delete the division
    await db.delete(divisions).where(eq(divisions.id, id))

    // Create audit log
    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'division.delete',
      resource: 'division',
      resourceId: id,
      details: { name: division[0].name, code: division[0].code },
      ipAddress: event.node?.req?.socket?.remoteAddress || 'unknown',
      userAgent: event.node?.req?.headers['user-agent'] || 'unknown'
    }).catch(console.error)

    return {
      success: true,
      message: 'Divisi berhasil dihapus'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    console.error('Error deleting division:', error)
    throw createError({
      statusCode: 500,
      message: 'Gagal menghapus divisi'
    })
  }
})
