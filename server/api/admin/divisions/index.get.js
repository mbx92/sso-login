import { defineEventHandler } from "h3";
import { db, divisions, sites } from "../../../db";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth";
function parseQuery(event) {
  try {
    const url = event.node?.req?.url || "";
    const queryString = url.split("?")[1] || "";
    const params = {};
    if (queryString) {
      queryString.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key) params[key] = decodeURIComponent(value || "");
      });
    }
    return params;
  } catch {
    return {};
  }
}
var index_get_default = defineEventHandler(async (event) => {
  const query = parseQuery(event);
  const siteId = query.siteId || void 0;
  const user = getAuthUser(event);
  const conditions = [];
  if (siteId) {
    conditions.push(eq(divisions.siteId, siteId));
  } else if (user && user.roleId !== "superadmin" && user.siteId) {
    conditions.push(eq(divisions.siteId, user.siteId));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const allDivisions = await db.select({
    id: divisions.id,
    siteId: divisions.siteId,
    siteName: sites.name,
    code: divisions.code,
    name: divisions.name,
    description: divisions.description,
    isActive: divisions.isActive,
    createdAt: divisions.createdAt,
    updatedAt: divisions.updatedAt
  }).from(divisions).leftJoin(sites, eq(divisions.siteId, sites.id)).where(whereClause).orderBy(divisions.name);
  return {
    divisions: allDivisions
  };
});
export {
  index_get_default as default
};
