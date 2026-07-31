import { defineEventHandler } from "h3";
import { requireAuthUser } from "../../utils/auth.js";
import { getUserPortalApps } from "../../utils/access-control.js";
import { isAdmin } from "../../utils/roles.js";

export default defineEventHandler(async (event) => {
  const user = requireAuthUser(event);
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
