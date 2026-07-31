export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith("/admin")) return;

  const userCookie = useCookie("sso_user");
  if (!userCookie.value) {
    return navigateTo("/login");
  }

  let user = userCookie.value;
  try {
    if (typeof user === "string") user = JSON.parse(user);
  } catch {
    return navigateTo("/login");
  }

  const roleName = user?.roleName?.toLowerCase?.();
  const roleId = user?.roleId;
  const isAdminUser =
    roleName === "superadmin" ||
    roleName === "admin" ||
    roleId === "superadmin" ||
    roleId === "admin";

  if (!isAdminUser) {
    return navigateTo("/apps");
  }
});
