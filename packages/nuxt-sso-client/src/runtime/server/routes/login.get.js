import { useRuntimeConfig } from 'nitropack/runtime'
import {
  defineEventHandler,
  createError,
  setCookie,
  sendRedirect,
} from 'h3'
import { createPkcePair, getSsoConfig, getCallbackUri } from '../utils/sso.js'

export default defineEventHandler(async (event) => {
  const sso = getSsoConfig()
  if (!sso.enabled) {
    throw createError({ statusCode: 503, statusMessage: 'SSO belum dikonfigurasi' })
  }

  // Use request host so PKCE cookie domain matches the callback domain
  const redirectUri = getCallbackUri(event, sso)
  if (!redirectUri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cannot determine callback URI from request',
    })
  }

  const { codeVerifier, codeChallenge, state } = createPkcePair()

  setCookie(event, sso.pkceCookie, JSON.stringify({ codeVerifier, state }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  const authorizeUrl = new URL(`${sso.issuer}/api/oidc/authorize`)
  authorizeUrl.searchParams.set('client_id', sso.clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'openid profile email')
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')

  return sendRedirect(event, authorizeUrl.toString(), 302)
})
