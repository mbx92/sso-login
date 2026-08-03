import { createHash, randomBytes } from 'node:crypto'
import { useRuntimeConfig } from 'nitropack/runtime'

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
 * Call the SSO issuer to validate an access token.
 * Returns `true` if the token is still valid (not revoked, not expired).
 * Use this in your app's server middleware or API handlers to detect
 * session revocation in real-time.
 *
 * @param {object} sso - config from getSsoConfig()
 * @param {string} accessToken
 * @returns {Promise<boolean>}
 */
export async function validateSsoSession(sso, accessToken) {
  if (!sso.enabled || !accessToken) return false

  try {
    const { $fetch } = await import('ofetch')
    const result = await $fetch(`${sso.issuer}/api/auth/check-session`, {
      method: 'POST',
      body: { access_token: accessToken },
      headers: { 'Content-Type': 'application/json' },
      ignoreResponseError: true,
    })
    return result?.valid === true
  }
  catch {
    return false
  }
}
