import { db, sites } from '../../../db'
import { eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { isSuperAdmin } from '../../../utils/roles'

export default defineEventHandler(async (event) => {
  const user = getAuthUser(event)
  
  let allSites
  
  // Jika user adalah superadmin atau tidak punya siteId (backward compatibility)
  // maka tampilkan semua sites
  if (!user || isSuperAdmin(user) || !user.siteId) {
    allSites = await db.select().from(sites).orderBy(sites.name)
  } 
  // Admin site hanya melihat site mereka
  else if (user.siteId) {
    allSites = await db.select().from(sites).where(eq(sites.id, user.siteId)).orderBy(sites.name)
  }
  
  return {
    sites: allSites
  }
})
