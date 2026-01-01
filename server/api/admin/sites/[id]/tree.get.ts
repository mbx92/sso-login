import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db, sites, divisions, units } from '../../../../db'
import { getAuthUser } from '../../../../utils/auth'
import { isSuperAdmin } from '../../../../utils/roles'

export default defineEventHandler(async (event) => {
  const siteId = event.context.params?.id
  const user = getAuthUser(event)

  if (!siteId) {
    throw createError({
      statusCode: 400,
      message: 'Site ID diperlukan'
    })
  }

  // Check authorization - only superadmin can view all sites
  if (user && !isSuperAdmin(user) && user.siteId !== siteId) {
    throw createError({
      statusCode: 403,
      message: 'Tidak memiliki akses ke site ini'
    })
  }

  try {
    // Get site info
    const [site] = await db.select()
      .from(sites)
      .where(eq(sites.id, siteId))
      .limit(1)

    if (!site) {
      throw createError({
        statusCode: 404,
        message: 'Site tidak ditemukan'
      })
    }

    // Get all divisions for this site
    const siteDivisions = await db.select({
      id: divisions.id,
      code: divisions.code,
      name: divisions.name,
      description: divisions.description,
      isActive: divisions.isActive
    })
    .from(divisions)
    .where(eq(divisions.siteId, siteId))
    .orderBy(divisions.name)

    // Get all units for this site
    const siteUnits = await db.select({
      id: units.id,
      divisionId: units.divisionId,
      code: units.code,
      name: units.name,
      description: units.description,
      isActive: units.isActive
    })
    .from(units)
    .where(eq(units.siteId, siteId))
    .orderBy(units.name)

    // Build tree structure
    const tree = siteDivisions.map(division => ({
      ...division,
      type: 'division' as const,
      children: siteUnits
        .filter(unit => unit.divisionId === division.id)
        .map(unit => ({
          ...unit,
          type: 'unit' as const
        }))
    }))

    return {
      site,
      tree,
      stats: {
        totalDivisions: siteDivisions.length,
        totalUnits: siteUnits.length
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching site tree:', error)
    throw createError({
      statusCode: 500,
      message: 'Gagal mengambil data struktur site'
    })
  }
})
