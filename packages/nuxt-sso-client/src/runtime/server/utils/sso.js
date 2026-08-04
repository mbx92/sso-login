import { createHash, randomBytes } from 'node:crypto'
import { useRuntimeConfig } from 'nitropack/runtime'
import { useSession } from 'h3'

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function createPkcePair() {
  const codeVerifier = base64Url(randomBytes(32))
  const codeChallenge = base64Url(createHash('sha256').update(codeVerifier).digest())
  const state = base64Url(randomBytes(16))
  return { codeVerifier, codeChallenge, state }
}

export function getSsoConfig() {
  const config = useRuntimeConfig()
  const appUrl = (config.public?.appUrl || '').replace(/\/$/, '')
  const issuer = (config.sso?.issuer || '').replace(/\/$/, '')
  const enabled = !!(issuer && config.sso?.clientId)

  return {
    enabled,
    issuer,
    clientId: config.sso?.clientId || '',
    clientSecret: config.sso?.clientSecret || '',
    autoProvision: config.sso?.autoProvision !== false,
    pkceCookie: config.sso?.pkceCookie || 'bros_sso_pkce',
    sessionCookie: config.sso?.sessionCookie || 'mbx_sso_session',
    successRedirect: config.sso?.successRedirect || '/',
    loginPath: config.sso?.loginPath || '/login',
    appUrl: appUrl || 'http://localhost:3000',
  }
}

/**
 * Build the callback URI dynamically from the incoming request host.
 * The PKCE cookie is host-bound — using the actual request host ensures
 * the cookie is sent back to the same domain when the SSO redirects.
 */
export function getCallbackUri(event, sso) {
  const host = event.node.req.headers.host || 'localhost:3000'
  const proto = event.node.req.headers['x-forwarded-proto'] === 'https' || event.node.req.socket?.encrypted ? 'https' : 'http'
  return `${proto}://${host}/api/auth/sso/callback`
}

export function failLoginRedirect(sso, message) {
  const url = new URL(sso.loginPath, sso.appUrl)
  url.searchParams.set('error', message)
  return url.toString()
}

export function successRedirectUrl(sso, path) {
  return new URL(path || sso.successRedirect, sso.appUrl).toString()
}

/**
 * Call the SSO issuer to check whether a user still has active sessions.
 * Returns `true` if the issuer confirms the account is still live (not
 * revoked, not expired). The issuer keys this off its own OIDC account id
 * (`userInfo.sub`), not any host-app-local user id.
 *
 * @param {object} sso - config from getSsoConfig()
 * @param {string} userId - the SSO issuer's account id (userInfo.sub)
 * @returns {Promise<boolean>}
 */
export async function validateSsoSession(sso, userId) {
  if (!sso.enabled || !userId) return false

  try {
    const { $fetch } = await import('ofetch')
    const result = await $fetch(`${sso.issuer}/api/auth/check-session`, {
      method: 'POST',
      body: { userId },
      headers: { 'Content-Type': 'application/json' },
      ignoreResponseError: true,
    })
    return result?.valid === true
  }
  catch {
    return false
  }
}

/**
 * Password for the package's own session cookie, derived from the client
 * secret so no extra env var is required. sha256 hex is always 64 chars,
 * satisfying h3's 32-char minimum regardless of how long clientSecret is.
 */
function sessionPassword(sso) {
  return createHash('sha256').update(`${sso.clientSecret}:${sso.issuer}`).digest('hex')
}

/**
 * The package keeps a small session of its own (separate from whatever
 * session mechanism the host app uses) so that check-session can work
 * without the host having to expose the SSO account id to client-side JS.
 * Stores only `{ sub }` — the issuer's OIDC account id.
 */
export function getSsoSession(event, sso) {
  return useSession(event, {
    name: sso.sessionCookie,
    password: sessionPassword(sso),
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
    },
  })
}
