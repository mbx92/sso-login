/**
 * Role-based access control utilities
 */

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(user: any): boolean {
  if (!user) return false
  
  // Check new roles array
  if (Array.isArray(user.roles) && user.roles.includes(ROLES.SUPERADMIN)) {
    return true
  }

  // Legacy check
  return user.roleName === ROLES.SUPERADMIN || user.roleId === ROLES.SUPERADMIN
}

/**
 * Check if user is admin (site admin or superadmin)
 */
export function isAdmin(user: any): boolean {
  if (!user) return false
  
  // Check new roles array
  if (Array.isArray(user.roles) && (user.roles.includes(ROLES.ADMIN) || user.roles.includes(ROLES.SUPERADMIN))) {
    return true
  }

  // Legacy check
  return isSuperAdmin(user) || 
         user.roleName === ROLES.ADMIN || 
         user.roleId === ROLES.ADMIN
}

/**
 * Get user's site ID from their unit
 * Returns null if user has no unit or if user is superadmin
 */
export function getUserSiteId(user: any): string | null {
  if (!user) return null
  if (isSuperAdmin(user)) return null // Superadmin can see all sites
  return user.siteId || null
}

/**
 * Check if user can access a specific site
 */
export function canAccessSite(user: any, siteId: string): boolean {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return getUserSiteId(user) === siteId
}
