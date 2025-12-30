export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on login page
  if (to.path === '/login') {
    return
  }

  // In client-side only mode, check cookies
  if (process.client) {
    const userCookie = useCookie('sso_user')
    
    console.log('Auth middleware - user:', userCookie.value ? 'exists' : 'missing')
    
    if (!userCookie.value) {
      console.log('Auth middleware - redirecting to login')
      // Not authenticated, redirect to login
      return navigateTo('/login')
    }
    
    console.log('Auth middleware - user authenticated:', userCookie.value)
  }
  
  // User is authenticated or server-side
  return
})
