const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  USER: "user"
};
function isSuperAdmin(user) {
  if (!user) return false;
  return user.roleName === ROLES.SUPERADMIN || user.roleId === ROLES.SUPERADMIN;
}
function isAdmin(user) {
  if (!user) return false;
  return isSuperAdmin(user) || user.roleName === ROLES.ADMIN || user.roleId === ROLES.ADMIN;
}
function getUserSiteId(user) {
  if (!user) return null;
  if (isSuperAdmin(user)) return null;
  return user.siteId || null;
}
function canAccessSite(user, siteId) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return getUserSiteId(user) === siteId;
}
export {
  ROLES,
  canAccessSite,
  getUserSiteId,
  isAdmin,
  isSuperAdmin
};
