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
    redirectUri:
      config.sso?.redirectUri ||
      (appUrl ? `${appUrl}/api/auth/sso/callback` : ''),
    autoProvision: config.sso?.autoProvision !== false,
    pkceCookie: config.sso?.pkceCookie || 'bros_sso_pkce',
    successRedirect: config.sso?.successRedirect || '/',
    loginPath: config.sso?.loginPath || '/login',
    appUrl: appUrl || 'http://localhost:3000',
  }
}

export function failLoginRedirect(sso, message) {
  const url = new URL(sso.loginPath, sso.appUrl)
  url.searchParams.set('error', message)
  return url.toString()
}

export function successRedirectUrl(sso, path) {
  return new URL(path || sso.successRedirect, sso.appUrl).toString()
}
