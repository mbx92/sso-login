import { createHash } from 'node:crypto'

/**
 * Normalize user-provided config into the shape expected by SsoClient.
 * Fills in defaults for optional fields.
 *
 * @param {Partial<import('./index.js').SsoConfig>} raw
 * @returns {import('./index.js').SsoConfig}
 */
export function normalizeSsoConfig(raw = {}) {
  const issuer = (raw.issuer || '').replace(/\/$/, '')
  const appUrl = (raw.appUrl || '').replace(/\/$/, '')

  return {
    issuer,
    clientId: raw.clientId || '',
    clientSecret: raw.clientSecret || '',
    redirectUri: raw.redirectUri || '',
    appUrl: appUrl || 'http://localhost:3000',
    successRedirect: raw.successRedirect || '/',
    loginPath: raw.loginPath || '/login',
    fetch: raw.fetch || undefined,
  }
}

/**
 * Derive a session password from clientSecret and issuer.
 * sha256 hex is always 64 chars.
 */
export function sessionPassword(config) {
  return createHash('sha256')
    .update(`${config.clientSecret}:${config.issuer}`)
    .digest('hex')
}
