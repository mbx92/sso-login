export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on login page and public pages
  if (to.path === '/login' || to.path === '/' || to.path === '/access-denied') {
    return
  }

  // Check cookie on both client and server side
  const userCookie = useCookie('sso_user')
  
  if (!userCookie.value) {
    // Not authenticated, redirect to login
    return navigateTo('/login')
  }
  
  // User is authenticated
  return
})
