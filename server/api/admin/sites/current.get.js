import { defineEventHandler, createError } from "h3";
import { db, sites } from "../../../db";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth";
var current_get_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized"
    });
  }
  if (user.roleId === "superadmin" || !user.siteId) {
    return {
      success: true,
      site: null,
      useDivisions: true,
      // Superadmin sees all
      useUnits: true
    };
  }
  try {
    const [site] = await db.select().from(sites).where(eq(sites.id, user.siteId)).limit(1);
    if (!site) {
      return {
        success: true,
        site: null,
        useDivisions: true,
        // Default to showing if site not found
        useUnits: true
      };
    }
    const useDivisions = site.useDivisions ?? true;
    const useUnits = site.useUnits ?? true;
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
    };
  } catch (error) {
    console.error("Error fetching current site:", error);
    return {
      success: true,
      site: null,
      useDivisions: true,
      useUnits: true
    };
  }
});
export {
  current_get_default as default
};
