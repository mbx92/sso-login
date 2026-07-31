import { db, sites } from "../../../db";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth";
import { isSuperAdmin } from "../../../utils/roles";
var index_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  let allSites;
  if (!user || isSuperAdmin(user) || !user.siteId) {
    allSites = await db.select().from(sites).orderBy(sites.name);
  } else if (user.siteId) {
    allSites = await db.select().from(sites).where(eq(sites.id, user.siteId)).orderBy(sites.name);
  }
  return {
    sites: allSites
  };
});
export {
  index_get_default as default
};
