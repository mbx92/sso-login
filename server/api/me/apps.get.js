import { defineEventHandler, createError } from "h3";
import { getSessionUser } from "../../utils/session.js";
import { getUserPortalApps } from "../../utils/access-control.js";
import { isAdmin } from "../../utils/roles.js";

export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Authentication required" });
  }
  const apps = await getUserPortalApps(user.userId || user.id);
  return {
    user: {
      id: user.userId || user.id,
      name: user.name,
      email: user.email,
      roleName: user.roleName,
      isAdmin: isAdmin(user),
    },
    apps,
  };
});
