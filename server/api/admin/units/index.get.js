import { defineEventHandler } from "h3";
import { db, units, divisions, sites } from "../../../db";
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
  const divisionId = query.divisionId || void 0;
  const user = getAuthUser(event);
  const conditions = [];
  if (divisionId) {
    conditions.push(eq(units.divisionId, divisionId));
  }
  if (siteId) {
    conditions.push(eq(units.siteId, siteId));
  } else if (user && user.roleName !== "superadmin" && user.roleId !== "superadmin" && user.siteId) {
    conditions.push(eq(units.siteId, user.siteId));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const allUnits = await db.select({
    id: units.id,
    siteId: units.siteId,
    siteName: sites.name,
    divisionId: units.divisionId,
    divisionName: divisions.name,
    code: units.code,
    name: units.name,
    description: units.description,
    isActive: units.isActive,
    createdAt: units.createdAt,
    updatedAt: units.updatedAt
  }).from(units).leftJoin(sites, eq(units.siteId, sites.id)).leftJoin(divisions, eq(units.divisionId, divisions.id)).where(whereClause).orderBy(units.name);
  return {
    units: allUnits
  };
});
export {
  index_get_default as default
};
