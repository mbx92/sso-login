var auth_default = defineNuxtRouteMiddleware((to) => {
  if (to.path === "/login" || to.path === "/" || to.path === "/access-denied") {
    return;
  }
  const userCookie = useCookie("sso_user");
  if (!userCookie.value) {
    return navigateTo("/login");
  }
  return;
});
export {
  auth_default as default
};
