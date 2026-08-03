/**
 * Resolve destination for an already-authenticated SSO user.
 * Superadmin/admin -> /admin, everyone else -> /apps.
 */
export function resolveAuthedDestination(user) {
  if (!user) return '/apps'
  const roleName = String(user.roleName || user.role_name || '').toLowerCase()
  const roleId = user.roleId || user.role_id
  const isAdmin =
    roleName === 'superadmin' ||
    roleName === 'admin' ||
    roleId === 'superadmin' ||
    roleId === 'admin'
  return isAdmin ? '/admin' : '/apps'
}

/**
 * Parse sso_user cookie (string or object) into a plain user object.
 * Display / routing hint only — API auth still validates sso_session server-side.
 */
export function readSsoUserCookie() {
  const raw = useCookie('sso_user').value
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Route gate for portal pages.
 *
 * IMPORTANT: `sso_session` is httpOnly, so `useCookie('sso_session')` only
 * works during SSR. On the client it is always empty — checking it alone
 * caused a flash to /login on every admin refresh (hydration blink).
 *
 * Use `sso_user` (readable on both sides) as the client presence signal.
 * Authoritative revoke still happens in Nitro middleware 04.session-check.js.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/access-denied' || to.path === '/logout' || to.path === '/consent') return

  const user = readSsoUserCookie()
  // SSR can also see httpOnly sso_session; client cannot — OR them together.
  const sessionId = useCookie('sso_session').value
  const isLoggedIn = !!(user || sessionId)

  // server/api/oidc/authorize.get.js only redirects here with ?client_id=...
  // when its own server-side getSessionUser() check found no valid sso_session
  // — e.g. a stale non-httpOnly `sso_user` cookie survives after the matching
  // sso_session row expired/was revoked. Bouncing to /admin here on that stale
  // cookie would drop client_id/redirect_uri/state, stranding the relying
  // party (e.g. mailOG) with no callback. Let doLogin() re-authenticate and
  // resume /api/oidc/authorize with the original params instead.
  if (to.path === '/login' && to.query.client_id) return

  if (isLoggedIn) {
    if (to.path === '/login' || to.path === '/') {
      return navigateTo(resolveAuthedDestination(user))
    }
    return
  }

  if (to.path !== '/login' && to.path !== '/') {
    return navigateTo('/login?reason=session_expired')
  }
})
