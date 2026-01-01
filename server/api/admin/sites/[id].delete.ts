import { eq } from 'drizzle-orm'
import { db, sites } from '../../../db'
import { createAuditLog } from '../../../services/audit'
import { getAuthUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  const id = getRouterParam(event, 'id')
  
  // Authorization: Only superadmin can delete sites
  if (user?.roleId !== 'superadmin') {
    throw createError({
      statusCode: 403,
      message: 'Hanya superadmin yang dapat menghapus site'
    })
  }
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID site tidak valid'
    })
  }

  try {
    const [deletedSite] = await db.delete(sites)
      .where(eq(sites.id, id))
      .returning()

    if (!deletedSite) {
      throw createError({
        statusCode: 404,
        message: 'Site tidak ditemukan'
      })
    }

    await createAuditLog({
      userId: user?.userId || 'system',
      action: 'site.delete',
      resource: 'site',
      resourceId: id,
      details: { code: deletedSite.code, name: deletedSite.name },
      ipAddress: event.node.req.socket.remoteAddress || '',
      userAgent: event.node.req.headers['user-agent'] || ''
    }).catch(console.error)

    return {
      success: true,
      message: 'Site berhasil dihapus'
    }
  } catch (error: any) {
    console.error('Error deleting site:', error)
    
    if (error.statusCode) throw error
    
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        message: 'Site tidak dapat dihapus karena masih memiliki divisi atau unit'
      })
    }
    throw createError({
      statusCode: 500,
      message: `Gagal menghapus site: ${error.message || 'Unknown error'}`
    })
  }
})
