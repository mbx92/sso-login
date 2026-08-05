import { defineEventHandler, sendRedirect } from 'h3'
import { getSsoConfig, getSsoSession, successRedirectUrl } from '../utils/sso.js'

/**
 * Terminates the package's own SSO session cookie and forwards to the
 * issuer's logout endpoint so the SSO session there is revoked too —
 * without this, clearing only the host app's session leaves the issuer
 * session alive and the user gets silently re-logged-in on next visit.
 */
export default defineEventHandler(async (event) => {
  const sso = getSsoConfig()

  if (!sso.enabled) {
    return sendRedirect(event, successRedirectUrl(sso, sso.loginPath), 302)
  }

  const ssoSession = await getSsoSession(event, sso)
  await ssoSession.clear()

  const logoutUrl = new URL(`${sso.issuer}/api/oidc/logout`)
  logoutUrl.searchParams.set('client_id', sso.clientId)
  logoutUrl.searchParams.set('post_logout_redirect_uri', sso.appUrl)

  return sendRedirect(event, logoutUrl.toString(), 302)
})
