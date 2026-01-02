import { defineEventHandler, createError } from 'h3'
import { db, sites } from '../../../db'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'

/**
 * Get current user's site settings
 * GET /api/admin/sites/current
 * 
 * Returns the site settings for the current user's site
 * Superadmin gets null (no specific site)
 */
export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Superadmin doesn't have a specific site - can see all menus
  if (user.roleId === 'superadmin' || !user.siteId) {
    return {
      success: true,
      site: null,
      useDivisions: true, // Superadmin sees all
      useUnits: true
    }
  }

  try {
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, user.siteId))
      .limit(1)

    if (!site) {
      return {
        success: true,
        site: null,
        useDivisions: true, // Default to showing if site not found
        useUnits: true
      }
    }

    // Handle case where useDivisions/useUnits columns don't exist yet (before migration)
    const useDivisions = (site as any).useDivisions ?? true
    const useUnits = (site as any).useUnits ?? true

    return {
      success: true,
      site: {
        id: site.id,
        code: site.code,
        name: site.name,
        useDivisions,
        useUnits
      },
      useDivisions,
      useUnits
    }
  } catch (error: any) {
    console.error('Error fetching current site:', error)
    // Return defaults instead of throwing error - don't break the UI
    return {
      success: true,
      site: null,
      useDivisions: true,
      useUnits: true
    }
  }
})
